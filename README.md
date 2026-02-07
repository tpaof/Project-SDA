# 💰 MoneyMate

[![Status: Development](https://img.shields.io/badge/Status-Development-yellow)]()
[![Platform: Web](https://img.shields.io/badge/Platform-Web-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern full-stack expense tracking system with OCR slip upload capabilities. Built with microservices architecture and cloud-native technologies, designed to demonstrate System and Distributed Architecture (SDA) concepts.

---

## 🛠️ Tech Stack

| Technology   | Icon                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| React        | ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)                    |
| Vite         | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)                       |
| TypeScript   | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)     |
| Tailwind CSS | ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) |
| Node.js      | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)            |
| Express.js   | ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)        |
| Python       | ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)                 |
| Flask        | ![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)                    |
| Redis        | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)                    |
| Docker       | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)                 |
| Kubernetes   | ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)     |
| PostgreSQL   | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)     |
| Prisma       | ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)                 |
| Terraform    | ![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)        |
| pnpm         | ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)                       |

---

## 🏗️ System Architecture

```
┌─────────────────┐
│   Frontend      │  React + Vite + TypeScript
│   (Client)      │  Port 5173
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Backend API   │  Node.js + Express
│   (Server)      │  Port 3000
└────┬───────┬────┘
     │       │
     │       └──────────────┐
     ▼                      ▼
┌─────────────┐    ┌───────────────────┐
│   Redis     │    │  Message Queue    │
│   Cache     │    │  (Pub/Sub)        │
└─────────────┘    └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │   OCR Workers     │
                   │   (Flask+Tess)    │
                   │   Scalable        │
                   └───────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** & **Docker Compose** (required for PostgreSQL database)
- **Python** >= 3.9 (for OCR worker, optional)

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd MoneyMate

# Install all dependencies (monorepo)
pnpm install

# Start everything with a single command!
# (starts PostgreSQL, runs migrations, starts client & server)
pnpm dev
```

> [!NOTE]
> Docker must be running before executing `pnpm dev`.
> The first run will pull the PostgreSQL image which may take a moment.

---

## 💻 Development

### 📋 Development Services

| Service                 | URL                   | Description              |
| ----------------------- | --------------------- | ------------------------ |
| 🌐 **Client (React)**   | http://localhost:5173 | Frontend Application     |
| 🚀 **Server (Express)** | http://localhost:3000 | Backend REST API         |
| 🔴 **Redis**            | localhost:6379        | Cache & Message Queue    |
| 🐍 **OCR Worker**       | http://localhost:5000 | Python Flask OCR Service |

### Development Commands

| Command           | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `pnpm dev`        | 🚀 **Start everything** (DB + migrations + client + server) |
| `pnpm dev:all`    | Start client & server only (assumes DB is running)          |
| `pnpm dev:client` | Start only client                                           |
| `pnpm dev:server` | Start only server                                           |

### Database Commands

| Command           | Description                |
| ----------------- | -------------------------- |
| `pnpm db:up`      | Start PostgreSQL container |
| `pnpm db:down`    | Stop PostgreSQL container  |
| `pnpm db:migrate` | Run Prisma migrations      |
| `pnpm db:studio`  | Open Prisma Studio GUI     |

### Build & Maintenance

```bash
# Build all packages
pnpm build

# Lint all code
pnpm lint

# Clean all build artifacts
pnpm clean
```

---

## 🐳 Container Development

### 🎯 Quick Start with Docker

```bash
# Build and start all containers
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop all containers
docker-compose down

# Clean up everything
docker-compose down -v --remove-orphans
```

### 🔍 Container Management

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server

# Access container shell
docker exec -it moneymate-server sh
```

---

## 📚 Environment Variables

### Backend Configuration (server/.env)

```env
# Server
PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis (Message Queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database (PostgreSQL) - matches docker-compose.yml defaults
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/moneymate

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

---

## 📋 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (returns JWT)
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current authenticated user

### Transactions (`/api/transactions`)

- `GET /api/transactions` - List user transactions
- `POST /api/transactions` - Create manual transaction
- `GET /api/transactions/:id` - Get transaction detail
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Slip Upload (`/api/slips`)

- `POST /api/slips/upload` - Upload slip image (triggers OCR)
- `GET /api/slips/:id` - Get slip processing status
- `GET /api/slips/:id/result` - Get OCR extracted data

### Dashboard (`/api/dashboard`)

- `GET /api/dashboard/summary` - Get income/expense summary
- `GET /api/dashboard/analytics` - Get spending analytics

---

## 🌿 Branch Workflow

### Branch Naming Convention

**🌿 Feature Branch**

```bash
feat/<module>/<task-name>
```

**🛠️ Fix Branch**

```bash
fix/<module>/<description>
```

**🚑 Hotfix Branch**

```bash
hotfix/<module>/<critical-issue>
```

**🔄 Refactor Branch**

```bash
refactor/<module>/<description>
```

**📚 Documentation Branch**

```bash
docs/<section>/<description>
```

---

## 📚 Commit Convention

Please follow conventional commit format:

```
<type>: <description>

[optional body]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `perf` - Performance improvements

### Rules

- Subject must not be sentence-case, start-case, pascal-case, upper-case
- Subject may not end with full stop
- Use imperative mood ("add" not "added")

### Examples

```bash
feat: add slip upload with OCR processing

- implemented multer file upload
- integrated Redis pub/sub for async job queue
- created OCR worker service endpoint
```

```bash
fix: resolve JWT token expiration issue

- updated token refresh logic
- added proper error handling for expired tokens
```

---

## ✨ Key Features

- **📸 Slip Upload & OCR**: Upload receipt images and automatically extract transaction data
- **🔐 JWT Authentication**: Secure user authentication with JSON Web Tokens
- **💳 Transaction Management**: Track income and expenses with categorization
- **📊 Dashboard Analytics**: Visualize spending patterns and financial summaries
- **⚡ Event-Driven Architecture**: Async OCR processing with Redis Pub/Sub
- **🐳 Containerized**: Docker support for all microservices
- **☸️ Kubernetes-Ready**: K8s manifests for scalable deployment
- **🏗️ Infrastructure as Code**: Terraform configurations for cloud provisioning
- **🔄 Horizontal Scaling**: OCR workers scale independently based on load
- **📦 Monorepo Structure**: Managed with pnpm workspace
- **🎨 Modern UI**: Responsive design with React and TailwindCSS
- **🔒 Security**: Password hashing, HTTPS support, helmet middleware

---

## 📂 Project Structure

```
MoneyMate/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── index.ts       # Entry point
│   └── package.json
│
├── services/               # Microservices
│   └── ocr-worker/        # Python OCR service
│       ├── app.py
│       └── requirements.txt
│
├── docker/                 # Docker configurations
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── Dockerfile.ocr
│
├── k8s/                    # Kubernetes manifests
│   ├── client-deployment.yaml
│   ├── server-deployment.yaml
│   └── ocr-worker-deployment.yaml
│
├── terraform/              # IaC configurations
│   └── main.tf
│
├── pnpm-workspace.yaml    # Workspace configuration
├── package.json           # Root scripts
└── README.md
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter client test
pnpm --filter server test

# Run tests with coverage
pnpm test:coverage
```

---

## 🚢 Deployment

### Docker Build

```bash
# Build all images
docker-compose build

# Push to registry
docker-compose push
```

### Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/moneymate-server
```

### Terraform Provisioning

```bash
cd terraform/

# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure
terraform apply
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

For questions, issues, or contributions:

- **Issues**: Create an issue in the repository
- **Discussions**: Use GitHub Discussions for Q&A

---

**Last Updated**: February 2026  
**Maintained By**: กะเพราหมูกรอบ
