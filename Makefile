# ==============================================================================
# MoneyMate - Makefile
# Common development, build, and deployment commands
# ==============================================================================

.PHONY: install dev dev-client dev-server lint test build clean \
        docker-build docker-up docker-down docker-logs docker-push \
        db-migrate db-studio deploy help

# Default target
.DEFAULT_GOAL := help

# Variables
COMPOSE_CMD = docker compose
COMPOSE_PROD = $(COMPOSE_CMD) -f docker-compose.yml -f docker-compose.prod.yml
VM_USER ?= $(shell whoami)
VM_HOST ?= YOUR_VM_IP

# ==============================================================================
# Development
# ==============================================================================

install: ## Install all dependencies
	pnpm install

dev: ## Start all services (local dev with Docker DB)
	pnpm dev

dev-client: ## Start client only
	pnpm local:dev:client

dev-server: ## Start server only
	pnpm local:dev:server

# ==============================================================================
# Code Quality
# ==============================================================================

lint: ## Lint all code
	pnpm lint

lint-fix: ## Lint and auto-fix
	pnpm --filter client run lint -- --fix
	pnpm --filter server run lint -- --fix

test: ## Run all tests
	pnpm test

# ==============================================================================
# Build
# ==============================================================================

build: ## Build all packages
	pnpm build

clean: ## Clean all build artifacts and node_modules
	pnpm clean

# ==============================================================================
# Database
# ==============================================================================

db-migrate: ## Run database migrations
	pnpm db:migrate

db-studio: ## Open Prisma Studio
	pnpm db:studio

db-up: ## Start PostgreSQL & Redis containers
	$(COMPOSE_CMD) up -d postgres redis

db-down: ## Stop database containers
	$(COMPOSE_CMD) down

# ==============================================================================
# Docker (Development)
# ==============================================================================

docker-build: ## Build all Docker images (dev)
	$(COMPOSE_CMD) build

docker-up: ## Start all containers (dev)
	$(COMPOSE_CMD) up -d --build

docker-down: ## Stop and remove all containers
	$(COMPOSE_CMD) down --remove-orphans

docker-logs: ## Follow container logs
	$(COMPOSE_CMD) logs -f

docker-ps: ## Show running containers
	$(COMPOSE_CMD) ps

docker-prune: ## Clean up unused Docker resources
	docker system prune -f

# ==============================================================================
# Docker (Production)
# ==============================================================================

docker-build-prod: ## Build production Docker images
	$(COMPOSE_PROD) build

docker-up-prod: ## Start production containers
	$(COMPOSE_PROD) up -d

docker-down-prod: ## Stop production containers
	$(COMPOSE_PROD) down --remove-orphans

docker-logs-prod: ## Follow production logs
	$(COMPOSE_PROD) logs -f

# ==============================================================================
# Image Registry (GHCR)
# ==============================================================================

docker-push: ## Build and push images to GHCR
	docker build -f docker/Dockerfile.server --target runtime -t ghcr.io/$(shell echo $(GITHUB_REPOSITORY_OWNER) | tr '[:upper:]' '[:lower:]')/moneymate/server:latest .
	docker build -f docker/Dockerfile.client --target runtime -t ghcr.io/$(shell echo $(GITHUB_REPOSITORY_OWNER) | tr '[:upper:]' '[:lower:]')/moneymate/client:latest .
	docker build -f docker/Dockerfile.ocr -t ghcr.io/$(shell echo $(GITHUB_REPOSITORY_OWNER) | tr '[:upper:]' '[:lower:]')/moneymate/ocr-worker:latest .
	docker push ghcr.io/$(shell echo $(GITHUB_REPOSITORY_OWNER) | tr '[:upper:]' '[:lower:]')/moneymate/server:latest
	docker push ghcr.io/$(shell echo $(GITHUB_REPOSITORY_OWNER) | tr '[:upper:]' '[:lower:]')/moneymate/client:latest
	docker push ghcr.io/$(shell echo $(GITHUB_REPOSITORY_OWNER) | tr '[:upper:]' '[:lower:]')/moneymate/ocr-worker:latest

# ==============================================================================
# Deployment
# ==============================================================================

deploy: ## Deploy to VM via SSH
	ssh $(VM_USER)@$(VM_HOST) 'cd /opt/moneymate && git pull origin main && \
		docker compose -f docker-compose.yml -f docker-compose.prod.yml build && \
		docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm server npx prisma migrate deploy && \
		docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans && \
		sleep 10 && curl -sf http://localhost:3000/api/health && echo " ✅ Deploy OK"'

deploy-script: ## Run deploy.sh on VM
	ssh $(VM_USER)@$(VM_HOST) 'bash /opt/moneymate/deploy/deploy.sh'

healthcheck: ## Check VM service health
	ssh $(VM_USER)@$(VM_HOST) 'bash /opt/moneymate/deploy/healthcheck.sh'

backup: ## Backup database on VM
	ssh $(VM_USER)@$(VM_HOST) 'bash /opt/moneymate/deploy/backup-db.sh'

# ==============================================================================
# Help
# ==============================================================================

help: ## Show this help message
	@echo ""
	@echo "MoneyMate - Available Commands"
	@echo "=============================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
