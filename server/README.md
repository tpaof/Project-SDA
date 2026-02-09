# Server

REST API server for MoneyMate.

## Tech Stack

Node.js, Express, Prisma, PostgreSQL, Redis.

## Development

TODO

## Database

PostgreSQL, Redis (see docker-compose.yml).

## Environment Variables

See [Environment Variables](#environment-variables) section below.

---

# MoneyMate API

REST API server for MoneyMate -- a personal finance tracker built with Express, Prisma, and PostgreSQL.

Base URL: `http://localhost:3000`

---

## Table of Contents

- [Getting Started](#getting-started)
- [Database](#database)
  - [Local PostgreSQL with Docker](#local-postgresql-with-docker)
  - [Environment Variables](#environment-variables)
  - [Schema Overview](#schema-overview)
  - [Entity Relationships](#entity-relationships)
  - [Prisma Configuration](#prisma-configuration)
  - [Migrations](#migrations)
  - [Seeding](#seeding)
  - [Connection Handling](#connection-handling)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Auth](#auth)
    - [Register](#post-apiauthregister)
    - [Login](#post-apiauthlogin)
    - [Logout](#post-apiauthlogout)
    - [Get Current User](#get-apiauthme)
  - [Transactions](#transactions)
    - [Create Transaction](#post-apitransactions)
    - [List Transactions](#get-apitransactions)
    - [Get Transaction by ID](#get-apitransactionsid)
    - [Update Transaction](#put-apitransactionsid)
    - [Delete Transaction](#delete-apitransactionsid)
    - [Get Summary](#get-apitransactionssummary)
- [Error Handling](#error-handling)
- [Scripts](#scripts)

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Set environment variables (see .env.example)
#   DATABASE_URL   - PostgreSQL connection string
#   JWT_SECRET     - Secret for signing JWTs
#   JWT_EXPIRES_IN - Token lifetime (default: "7d")
#   PORT           - Server port (default: 3000)

# Run database migrations
pnpm prisma migrate deploy

# Seed the database (optional)
pnpm prisma db seed

# Start the dev server
pnpm dev
```

---

## Database

The server uses **PostgreSQL** as its database and **Prisma 7** (with the `@prisma/adapter-pg` driver adapter) as its ORM.

### Local PostgreSQL with Docker

A `docker-compose.yml` is provided at the project root for spinning up a local PostgreSQL 15 instance:

```bash
# From the project root
docker compose up -d
```

This starts PostgreSQL on port **5432** with the following defaults:

| Setting            | Value       |
| ------------------ | ----------- |
| `POSTGRES_USER`    | `user`      |
| `POSTGRES_PASSWORD`| `password`  |
| `POSTGRES_DB`      | `moneymate` |

The matching connection string is:

```
DATABASE_URL="postgresql://user:password@localhost:5432/moneymate"
```

### Environment Variables

| Variable       | Required | Default | Description                              |
| -------------- | -------- | ------- | ---------------------------------------- |
| `DATABASE_URL` | Yes      | --      | PostgreSQL connection string             |
| `JWT_SECRET`   | Yes      | --      | Secret key for signing JWT tokens        |
| `JWT_EXPIRES_IN` | No     | `7d`    | Token lifetime (e.g. `1h`, `7d`, `30d`) |
| `PORT`         | No       | `3000`  | HTTP server port                         |
| `NODE_ENV`     | No       | --      | Set to `development` to enable Prisma query logging |

### Schema Overview

The database contains three tables, managed by Prisma:

#### `users`

| Column       | Type        | Constraints                    | Description              |
| ------------ | ----------- | ------------------------------ | ------------------------ |
| `id`         | `TEXT`      | PK, CUID auto-generated       | Unique user identifier   |
| `email`      | `TEXT`      | UNIQUE, NOT NULL               | User email address       |
| `password`   | `TEXT`      | NOT NULL                       | Bcrypt-hashed password   |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT `now()`      | Account creation time    |
| `updated_at` | `TIMESTAMP` | NOT NULL, auto-updated         | Last profile update time |

#### `transactions`

| Column        | Type        | Constraints                    | Description                          |
| ------------- | ----------- | ------------------------------ | ------------------------------------ |
| `id`          | `TEXT`      | PK, UUID auto-generated        | Unique transaction identifier        |
| `type`        | `TEXT`      | NOT NULL                       | `"income"` or `"expense"`            |
| `amount`      | `DOUBLE`    | NOT NULL                       | Positive monetary amount             |
| `description` | `TEXT`      | nullable                       | Optional description (max 500 chars) |
| `category`    | `TEXT`      | nullable                       | Optional category (max 100 chars)    |
| `date`        | `TIMESTAMP` | NOT NULL                       | When the transaction occurred        |
| `userId`      | `TEXT`      | FK -> `users.id`, NOT NULL     | Owner of the transaction             |
| `slipId`      | `TEXT`      | FK -> `slips.id`, nullable     | Associated receipt slip              |
| `createdAt`   | `TIMESTAMP` | NOT NULL, DEFAULT `now()`      | Record creation time                 |

#### `slips`

| Column         | Type        | Constraints                    | Description                           |
| -------------- | ----------- | ------------------------------ | ------------------------------------- |
| `id`           | `TEXT`      | PK, UUID auto-generated        | Unique slip identifier                |
| `filename`     | `TEXT`      | NOT NULL                       | Stored file name                      |
| `originalName` | `TEXT`      | NOT NULL                       | Original upload file name             |
| `status`       | `TEXT`      | NOT NULL                       | `"pending"` / `"processing"` / `"completed"` / `"failed"` |
| `ocrResult`    | `JSONB`     | nullable                       | Parsed OCR output                     |
| `userId`       | `TEXT`      | FK -> `users.id`, NOT NULL     | Owner of the slip                     |
| `createdAt`    | `TIMESTAMP` | NOT NULL, DEFAULT `now()`      | Upload time                           |
| `processedAt`  | `TIMESTAMP` | nullable                       | When OCR processing finished          |

### Entity Relationships

```
users
  |-- 1:N -- transactions   (user.id -> transactions.userId)
  |-- 1:N -- slips          (user.id -> slips.userId)

slips
  |-- 1:N -- transactions   (slips.id -> transactions.slipId, nullable)
```

- Deleting a **user** is restricted if they still have transactions or slips (referential integrity).
- Deleting a **slip** sets `slipId` to `NULL` on related transactions (`ON DELETE SET NULL`).

### Prisma Configuration

Prisma is configured via `prisma.config.ts` at the server root:

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "pnpm ts-node prisma/seed.ts"
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

Because the project uses **Prisma 7**, the PostgreSQL driver adapter (`@prisma/adapter-pg`) is required. The Prisma client is initialized in `src/lib/prisma.ts` with a `pg.Pool` connection and a singleton pattern for development hot-reloading.

### Migrations

Migrations live in `prisma/migrations/`. The initial migration (`20260205134445_init`) creates all three tables, indexes, and foreign keys.

```bash
# Apply all pending migrations to the database
pnpm prisma migrate deploy

# Create a new migration after editing schema.prisma
pnpm prisma migrate dev --name <migration-name>

# Reset the database (drops all data, re-applies migrations, re-seeds)
pnpm prisma migrate reset
```

### Seeding

The seed script (`prisma/seed.ts`) creates sample data for development:

- A demo user (`demo@example.com` / `password123`)
- A sample slip (receipt image with OCR result)
- Two sample transactions (one income, one expense)

```bash
pnpm prisma db seed
```

> **Note:** The seed user's password is stored in plain text for convenience. Production users created via the `/api/auth/register` endpoint have bcrypt-hashed passwords.

### Connection Handling

The `connectPrisma()` function exported from `src/lib/prisma.ts` provides a safe, non-throwing connectivity check:

```ts
import { connectPrisma } from './lib/prisma.js';

const result = await connectPrisma();
if (!result.ok) {
  console.error(result.errorType, result.message);
}
```

It classifies connection failures into these error types:

| Error Type                  | Cause                                          |
| --------------------------- | ---------------------------------------------- |
| `DATABASE_UNREACHABLE`      | PostgreSQL is not running or host/port is wrong |
| `DATABASE_HOST_NOT_FOUND`   | DNS resolution failed for the database host     |
| `DATABASE_TIMEOUT`          | Connection timed out                            |
| `DATABASE_AUTH_FAILURE`     | Wrong username or password                      |
| `DATABASE_SSL_ERROR`        | SSL/TLS negotiation failed                      |
| `DATABASE_UNKNOWN_ERROR`    | Any other connection error                      |

You can test connectivity independently with:

```bash
pnpm test:db
```

---

## Authentication

All `/api/transactions/*` endpoints require a valid JWT.

Pass the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained from the [Login](#post-apiauthlogin) endpoint.

If the header is missing or the token is invalid/expired, the server responds with:

```json
{
  "error": "Authorization header missing or invalid"
}
```

Status: `401 Unauthorized`

---

## Endpoints

### Health Check

#### `GET /health`

Returns the server status.

**Response** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-02-07T12:00:00.000Z"
}
```

---

### Auth

#### `POST /api/auth/register`

Create a new user account.

**Request Body**

| Field      | Type   | Required | Rules                        |
| ---------- | ------ | -------- | ---------------------------- |
| `email`    | string | Yes      | Valid email format            |
| `password` | string | Yes      | Minimum 8 characters          |

**Example**

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response** `201 Created`

```json
{
  "user": {
    "id": "cm...",
    "email": "user@example.com",
    "createdAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**Errors**

| Status | Body                                        | Cause                    |
| ------ | ------------------------------------------- | ------------------------ |
| 400    | `{ "error": "Validation failed", "details": [...] }` | Invalid input            |
| 409    | `{ "error": "Email already registered" }`   | Duplicate email          |

---

#### `POST /api/auth/login`

Authenticate and receive a JWT.

**Request Body**

| Field      | Type   | Required | Rules              |
| ---------- | ------ | -------- | ------------------ |
| `email`    | string | Yes      | Valid email format  |
| `password` | string | Yes      | Non-empty           |

**Example**

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cm...",
    "email": "user@example.com",
    "createdAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**Errors**

| Status | Body                                        | Cause                    |
| ------ | ------------------------------------------- | ------------------------ |
| 400    | `{ "error": "Validation failed", "details": [...] }` | Invalid input            |
| 401    | `{ "error": "Invalid email or password" }`  | Wrong credentials        |

---

#### `POST /api/auth/logout`

Client-side logout acknowledgement. Since JWTs are stateless, the client should discard the token.

**Response** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

---

#### `GET /api/auth/me`

Get the currently authenticated user's profile. **Requires auth.**

**Response** `200 OK`

```json
{
  "user": {
    "id": "cm...",
    "email": "user@example.com",
    "createdAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**Errors**

| Status | Body                              | Cause           |
| ------ | --------------------------------- | --------------- |
| 401    | `{ "error": "..." }`             | Missing/bad JWT |
| 404    | `{ "error": "User not found" }`  | Deleted user    |

---

### Transactions

All transaction endpoints require authentication.

---

#### `POST /api/transactions`

Create a new transaction.

**Request Body**

| Field         | Type   | Required | Rules                                        |
| ------------- | ------ | -------- | -------------------------------------------- |
| `type`        | string | Yes      | `"income"` or `"expense"`                    |
| `amount`      | number | Yes      | Positive number                               |
| `date`        | string | Yes      | Valid ISO 8601 date string                    |
| `description` | string | No       | Max 500 characters, trimmed                   |
| `category`    | string | No       | Max 100 characters, trimmed                   |

**Example**

```json
{
  "type": "expense",
  "amount": 42.50,
  "date": "2026-02-07T10:30:00.000Z",
  "description": "Lunch",
  "category": "Food"
}
```

**Response** `201 Created`

```json
{
  "data": {
    "id": "a1b2c3d4-...",
    "type": "expense",
    "amount": 42.5,
    "description": "Lunch",
    "category": "Food",
    "date": "2026-02-07T10:30:00.000Z",
    "userId": "cm...",
    "slipId": null,
    "createdAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**Errors**

| Status | Body                                        | Cause           |
| ------ | ------------------------------------------- | --------------- |
| 400    | `{ "error": "Validation failed", "details": [...] }` | Invalid input   |
| 401    | `{ "error": "..." }`                       | Missing/bad JWT |

---

#### `GET /api/transactions`

List the authenticated user's transactions with optional filtering and pagination.

**Query Parameters**

| Param       | Type   | Default | Description                                  |
| ----------- | ------ | ------- | -------------------------------------------- |
| `type`      | string | --      | Filter by `"income"` or `"expense"`          |
| `category`  | string | --      | Filter by category (case-insensitive)        |
| `startDate` | string | --      | ISO 8601 lower bound for `date`              |
| `endDate`   | string | --      | ISO 8601 upper bound for `date`              |
| `minAmount` | number | --      | Minimum amount (positive)                     |
| `maxAmount` | number | --      | Maximum amount (positive)                     |
| `page`      | number | `1`     | Page number (positive integer)                |
| `limit`     | number | `20`    | Items per page (1 -- 100)                     |

**Example**

```
GET /api/transactions?type=expense&category=Food&page=1&limit=10
```

**Response** `200 OK`

```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "type": "expense",
      "amount": 42.5,
      "description": "Lunch",
      "category": "Food",
      "date": "2026-02-07T10:30:00.000Z",
      "userId": "cm...",
      "slipId": null,
      "createdAt": "2026-02-07T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### `GET /api/transactions/:id`

Get a single transaction by ID. Only the owner can access it.

**Response** `200 OK`

```json
{
  "data": {
    "id": "a1b2c3d4-...",
    "type": "expense",
    "amount": 42.5,
    "description": "Lunch",
    "category": "Food",
    "date": "2026-02-07T10:30:00.000Z",
    "userId": "cm...",
    "slipId": null,
    "createdAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**Errors**

| Status | Body                                                              | Cause                    |
| ------ | ----------------------------------------------------------------- | ------------------------ |
| 401    | `{ "error": "..." }`                                             | Missing/bad JWT          |
| 403    | `{ "error": "You do not have permission to access this transaction" }` | Not the owner            |
| 404    | `{ "error": "Transaction not found" }`                           | Invalid ID               |

---

#### `PUT /api/transactions/:id`

Update a transaction. All fields are optional -- only provided fields are changed.

**Request Body** (all optional)

| Field         | Type   | Rules                                        |
| ------------- | ------ | -------------------------------------------- |
| `type`        | string | `"income"` or `"expense"`                    |
| `amount`      | number | Positive number                               |
| `date`        | string | Valid ISO 8601 date string                    |
| `description` | string | Max 500 characters, trimmed                   |
| `category`    | string | Max 100 characters, trimmed                   |

**Example**

```json
{
  "amount": 55.00,
  "category": "Dining"
}
```

**Response** `200 OK`

```json
{
  "data": {
    "id": "a1b2c3d4-...",
    "type": "expense",
    "amount": 55,
    "description": "Lunch",
    "category": "Dining",
    "date": "2026-02-07T10:30:00.000Z",
    "userId": "cm...",
    "slipId": null,
    "createdAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**Errors**

| Status | Body                                                              | Cause           |
| ------ | ----------------------------------------------------------------- | --------------- |
| 400    | `{ "error": "Validation failed", "details": [...] }`            | Invalid input   |
| 401    | `{ "error": "..." }`                                             | Missing/bad JWT |
| 403    | `{ "error": "You do not have permission to access this transaction" }` | Not the owner   |
| 404    | `{ "error": "Transaction not found" }`                           | Invalid ID      |

---

#### `DELETE /api/transactions/:id`

Delete a transaction. Only the owner can delete it.

**Response** `200 OK`

```json
{
  "message": "Transaction deleted successfully"
}
```

**Errors**

| Status | Body                                                              | Cause           |
| ------ | ----------------------------------------------------------------- | --------------- |
| 401    | `{ "error": "..." }`                                             | Missing/bad JWT |
| 403    | `{ "error": "You do not have permission to access this transaction" }` | Not the owner   |
| 404    | `{ "error": "Transaction not found" }`                           | Invalid ID      |

---

#### `GET /api/transactions/summary`

Get an aggregated summary of the authenticated user's transactions.

**Query Parameters**

| Param       | Type   | Default | Description                          |
| ----------- | ------ | ------- | ------------------------------------ |
| `startDate` | string | --      | ISO 8601 lower bound for `date`      |
| `endDate`   | string | --      | ISO 8601 upper bound for `date`      |

**Example**

```
GET /api/transactions/summary?startDate=2026-01-01&endDate=2026-01-31
```

**Response** `200 OK`

```json
{
  "data": {
    "totalIncome": 5000,
    "totalExpense": 1250.75,
    "balance": 3749.25,
    "transactionCount": 14
  }
}
```

---

## Error Handling

All errors follow a consistent shape:

```json
{
  "error": "Human-readable error message"
}
```

Validation errors include additional detail:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Password must be at least 8 characters",
      "path": ["password"]
    }
  ]
}
```

### Common Status Codes

| Status | Meaning                |
| ------ | ---------------------- |
| 200    | Success                |
| 201    | Created                |
| 400    | Validation error       |
| 401    | Unauthorized           |
| 403    | Forbidden (not owner)  |
| 404    | Not found              |
| 409    | Conflict (duplicate)   |
| 500    | Internal server error  |

---

## Scripts

Run from the `server/` directory:

| Command                  | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `pnpm dev`               | Start the development server with hot reload             |
| `pnpm build`             | Compile TypeScript to JavaScript                         |
| `pnpm start`             | Run the compiled production server                       |
| `pnpm test:db`           | Test database connectivity                               |
| `pnpm test:transactions` | End-to-end smoke test for all transaction endpoints      |
| `pnpm prisma migrate deploy` | Apply pending database migrations                   |
| `pnpm prisma db seed`    | Seed the database with sample data                       |
