#!/bin/bash
# ==============================================================================
# MoneyMate - Deployment Script
# Pull latest code, build images, run migrations, restart services
# Usage: ./deploy.sh [--build|--pull|--rollback]
# ==============================================================================
set -euo pipefail

APP_DIR="/opt/moneymate"
COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
BACKUP_DIR="$APP_DIR/backups"
HEALTH_URL="http://localhost:3000/api/health"
HEALTH_TIMEOUT=30
LOG_FILE="/var/log/moneymate/deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${RED}[ERROR]${NC} $1"; }

# ------------------------------------------------------------------------------
# Pre-flight checks
# ------------------------------------------------------------------------------
preflight() {
  log "Running pre-flight checks..."

  if ! command -v docker &> /dev/null; then
    error "Docker not installed. Run setup-vm.sh first."
    exit 1
  fi

  if ! docker compose version &> /dev/null; then
    error "Docker Compose plugin not installed."
    exit 1
  fi

  if [ ! -f "$APP_DIR/.env" ]; then
    error ".env file not found. Copy from deploy/.env.example and configure."
    exit 1
  fi

  log "Pre-flight checks passed ✓"
}

# ------------------------------------------------------------------------------
# Create pre-deploy backup
# ------------------------------------------------------------------------------
backup_before_deploy() {
  log "Creating pre-deploy database backup..."
  mkdir -p "$BACKUP_DIR"

  if docker ps --format '{{.Names}}' | grep -q moneymate-postgres; then
    local BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz"
    docker exec moneymate-postgres pg_dump -U postgres moneymate | gzip > "$BACKUP_FILE"
    log "Backup created: $BACKUP_FILE"
  else
    warn "PostgreSQL not running, skipping backup"
  fi
}

# ------------------------------------------------------------------------------
# Pull latest code
# ------------------------------------------------------------------------------
pull_code() {
  log "Pulling latest code..."
  cd "$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
  log "Code updated to $(git rev-parse --short HEAD)"
}

# ------------------------------------------------------------------------------
# Build / pull images
# ------------------------------------------------------------------------------
build_images() {
  log "Building Docker images..."
  cd "$APP_DIR"
  $COMPOSE_CMD build --parallel
  log "Images built successfully ✓"
}

# ------------------------------------------------------------------------------
# Run database migrations
# ------------------------------------------------------------------------------
run_migrations() {
  log "Running database migrations..."
  cd "$APP_DIR"

  # Ensure postgres is running first
  $COMPOSE_CMD up -d postgres
  sleep 5

  $COMPOSE_CMD run --rm server npx prisma migrate deploy
  log "Migrations complete ✓"
}

# ------------------------------------------------------------------------------
# Deploy services
# ------------------------------------------------------------------------------
deploy_services() {
  log "Starting services..."
  cd "$APP_DIR"
  $COMPOSE_CMD up -d
  log "Services started ✓"
}

# ------------------------------------------------------------------------------
# Health check
# ------------------------------------------------------------------------------
health_check() {
  log "Running health check (timeout: ${HEALTH_TIMEOUT}s)..."
  local attempts=0
  local max_attempts=$((HEALTH_TIMEOUT / 3))

  while [ $attempts -lt $max_attempts ]; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
      log "Health check passed ✓"
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 3
  done

  error "Health check failed after ${HEALTH_TIMEOUT}s"
  return 1
}

# ------------------------------------------------------------------------------
# Show service status
# ------------------------------------------------------------------------------
show_status() {
  echo ""
  log "Service status:"
  cd "$APP_DIR"
  $COMPOSE_CMD ps
  echo ""
}

# ------------------------------------------------------------------------------
# Rollback
# ------------------------------------------------------------------------------
rollback() {
  error "Deployment failed! Rolling back..."
  cd "$APP_DIR"

  # Rollback to previous commit
  git reset --hard HEAD~1
  $COMPOSE_CMD build --parallel
  $COMPOSE_CMD up -d

  warn "Rolled back to $(git rev-parse --short HEAD)"
  warn "Check logs: docker compose logs --tail=100"
  exit 1
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
main() {
  echo ""
  echo "🚀 MoneyMate Deployment"
  echo "========================"
  echo "Time: $(date)"
  echo "Dir:  $APP_DIR"
  echo ""

  preflight

  case "${1:-deploy}" in
    --rollback)
      warn "Manual rollback requested"
      cd "$APP_DIR"
      git reset --hard HEAD~1
      $COMPOSE_CMD build --parallel
      $COMPOSE_CMD up -d
      log "Rolled back to $(git rev-parse --short HEAD)"
      show_status
      exit 0
      ;;
    --build)
      # Build only, no git pull
      build_images
      deploy_services
      ;;
    --pull)
      # Pull images from registry (if using pre-built images)
      cd "$APP_DIR"
      $COMPOSE_CMD pull 2>/dev/null || true
      deploy_services
      ;;
    deploy|*)
      backup_before_deploy
      pull_code
      build_images
      run_migrations
      deploy_services
      ;;
  esac

  if health_check; then
    show_status
    log "✅ Deployment successful! ($(git -C "$APP_DIR" rev-parse --short HEAD))"
  else
    show_status
    $COMPOSE_CMD logs --tail=50
    rollback
  fi
}

main "$@"
