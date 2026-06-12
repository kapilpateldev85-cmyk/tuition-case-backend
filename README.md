# TuitionSpace API

REST API for **TuitionSpace** — a tuition marketplace where parents post cases, invite tutors, and share documents securely. Built with NestJS, PostgreSQL, and Prisma.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Authorization Model](#authorization-model)
- [File Uploads](#file-uploads)
- [Swagger Documentation](#swagger-documentation)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

TuitionSpace connects **parents** and **tutors** around tuition cases:

| Actor | Capabilities |
|-------|--------------|
| **Parent** | Create/manage cases, browse tutor directory, invite tutors, upload case documents |
| **Tutor** | Manage profile, accept/decline invitations, view invited cases, upload case & profile documents |

Design priorities:

- **Security** — bcrypt passwords, JWT auth, server-side authorization on every sensitive route
- **Reliability** — validation, structured errors, auto-migrations on startup
- **Developer experience** — OpenAPI/Swagger, feature-based modules, Prisma ORM

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT (access + refresh), Passport.js |
| Validation | class-validator, class-transformer |
| Docs | Swagger / OpenAPI |
| Security | Helmet, CORS, bcryptjs |
| Files | Multer (local disk storage) |

---

## Architecture

```
src/
├── common/           # Decorators, DTOs, filters, pipes, utils
├── config/           # Environment configuration
├── database/         # PrismaService, migration runner
└── features/
    ├── auth/         # Register, login, refresh, me
    ├── cases/        # Cases, invitations, accept/decline
    ├── tutors/       # Tutor profiles & directory
    └── documents/    # Upload, download, delete
```

**Request flow:** `Controller → JwtAuthGuard / RoleGuard → Service → Prisma → PostgreSQL`

Migrations run automatically on server start via `prisma migrate deploy` (disable with `SKIP_MIGRATIONS=true`).

---

## Prerequisites

- **Node.js** 20 or later
- **PostgreSQL** 14+ (local or hosted, e.g. Render, Supabase, Neon)
- **npm**

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit DATABASE_URL, JWT secrets, FRONTEND_URL

# 3. Apply migrations (no seed required)
npm run db:migrate

# 4. Start development server (with hot reload)
npm run start:dev
```

| Resource | URL |
|----------|-----|
| API (local) | http://localhost:3000 |
| API (production) | https://tuition-case-backend.onrender.com |
| Swagger UI | `/api/docs` on either host |

> Register users via the app — no demo seed. Wipe DB: `npm run db:clear`. See [DEPLOYMENT.md](../DEPLOYMENT.md).

---

## Environment Variables

Copy `.env.example` and configure:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/tuition_marketplace` |
| `JWT_SECRET` | Access token signing secret | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Different random string |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3001` |
| `UPLOAD_PATH` | File storage directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload bytes | `10485760` (10 MB) |
| `SKIP_MIGRATIONS` | Skip auto-migrate on boot | `true` (optional) |

**Production:** Generate secrets with `openssl rand -hex 32`. Never commit `.env`.

---

## Database

### Migrations

```bash
npm run db:migrate        # Development: create/apply migrations
npm run db:migrate:prod   # Production: apply pending migrations only
```

### Seed

Seeding is **disabled** (no demo users). Create accounts via `/auth/register` or the app sign-up page.

To **delete all data** from the database:

```bash
npm run db:clear
```

### Prisma Studio

```bash
npm run db:studio
```

### Schema (core models)

```
User ── Parent / Tutor (1:1)
User ── Case (owner, 1:N)
Case ── CaseInvitation ── Tutor
Case ── Document
Tutor ── TutorDocument
```

**Invitation statuses:** `PENDING` → `ACCEPTED` | `DECLINED`

---

## Accounts

There are **no pre-seeded users**. After deploy or `db:clear`, register via:

- App: `/register`
- API: `POST /auth/register` with `{ email, password, role: "PARENT" | "TUTOR" }`

**Production sign-up:** https://tuition-case-frontend-t7jb.vercel.app/register

---

## API Reference

Full interactive docs: **`GET /api/docs`** (Swagger UI).

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register parent or tutor |
| POST | `/auth/login` | — | Login, receive tokens |
| POST | `/auth/refresh` | — | Refresh access token |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/auth/change-password` | Bearer | Change password |

### Cases

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/cases` | Parent | Create case |
| GET | `/cases` | Auth | List cases (scoped by role) |
| GET | `/cases/:id` | Auth | Case detail + documents + invitations |
| PATCH | `/cases/:id` | Parent | Update own case |
| DELETE | `/cases/:id` | Parent | Delete own case |
| POST | `/cases/:id/invite` | Parent | Invite tutor `{ tutorId }` |
| DELETE | `/cases/:id/invite/:tutorId` | Parent | Revoke invitation |
| GET | `/cases/my-invitations` | Tutor | List my invitations |
| PATCH | `/cases/invitations/:id` | Tutor | Accept/decline `{ status: "ACCEPTED" \| "DECLINED" }` |

### Tutors

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/tutors` | — | Paginated directory + search |
| GET | `/tutors/:id` | — | Public profile + documents |
| GET | `/tutors/me` | Tutor | Own profile |
| POST | `/tutors/profile` | Tutor | Create profile |
| PATCH | `/tutors/profile` | Tutor | Update profile |

### Documents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/documents/cases/:caseId` | Auth | Upload to case (multipart `file`) |
| POST | `/documents/tutors/profile` | Tutor | Upload to own profile |
| GET | `/documents/cases/:caseId` | Auth | List case documents |
| GET | `/documents/:id/download` | Auth | Download (re-checks authorization) |
| DELETE | `/documents/:id` | Auth | Delete case or profile document |

### Pagination & filters

List endpoints accept query params:

```
?page=1&limit=10&search=math&subject=MATHEMATICS&level=P5&status=OPEN
```

---

## Authentication

**Strategy:** Stateless JWT with refresh tokens.

| Token | Lifetime | Usage |
|-------|----------|-------|
| Access | 15 minutes | `Authorization: Bearer <token>` |
| Refresh | 7 days | `POST /auth/refresh` body `{ refreshToken }` |

**JWT payload:**

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "PARENT | TUTOR"
}
```

Passwords are hashed with **bcrypt** (10 rounds). Invalid credentials return `401` without revealing whether the email exists.

---

## Authorization Model

Enforced in **service layer** (not UI-only).

| Resource | Parent | Tutor |
|----------|--------|-------|
| Own cases | Full access | — |
| Invited cases | — | View if invited & not declined |
| Other parents' cases | Denied (`403`) | Denied (`403`) |
| Tutor directory | Browse | — |
| Tutor profile edit | — | Own profile only |
| Case documents | Own cases | Invited cases only |
| Profile documents | View (public profile) | Own profile only |

**HTTP status conventions:**

- `401` — Not authenticated
- `403` — Authenticated but not permitted
- `404` — Resource not found (used when hiding unauthorized case existence is not required)

---

## File Uploads

| Constraint | Value |
|------------|-------|
| Max size | 10 MB (configurable) |
| Allowed types | PDF, DOC, DOCX, PNG, JPG, JPEG, XLSX |
| Storage | Local `./uploads` (UUID + timestamp filenames) |
| Security | MIME + extension validation, path traversal prevention, auth on download |

Files are stored outside the web root; API responses never expose filesystem paths.

---

## Swagger Documentation

Start the server and open:

```
http://localhost:3000/api/docs
```

- Bearer auth supported (persist authorization in UI)
- All DTOs, enums, and response codes documented
- Use **Authorize** after login to test protected routes

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Migrate + run production build |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:migrate:prod` | Prisma migrate deploy |
| `npm run db:seed` | No-op (demo seed disabled) |
| `npm run db:clear` | Delete all users, cases, documents |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |

---

## Deployment

### Render / Railway / Fly.io (recommended pattern)

1. Provision **PostgreSQL** and set `DATABASE_URL`
2. Set all env vars from [Environment Variables](#environment-variables)
3. Build command: `npm install && npm run build`
4. Start command: `npm run start:prod`
5. Set `FRONTEND_URL` to your deployed frontend origin
6. Use a **persistent volume** or object storage for `UPLOAD_PATH` in production

### Manual

```bash
npm ci
npm run build
npm run db:migrate:prod
npm run start:prod
```

> `start:prod` runs migrations then starts `node dist/src/main`.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Table User does not exist` | Run `npm run db:migrate` or restart server (auto-migrates) |
| `Cannot find module dist/main` | Use `npm run start:prod` (entry is `dist/src/main`) |
| CORS errors | Match `FRONTEND_URL` to your frontend origin exactly |
| JWT errors | Check secrets are set; token may be expired — refresh or re-login |
| Upload fails | Check `UPLOAD_PATH` exists and is writable; verify file type/size |
| Tutor sees no cases | Parent must invite tutor; tutor must **accept** invitation |
| Empty tutor case list after decline | Expected — declined invitations remove case access |

---

## License

MIT
