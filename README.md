# School Admission System

Take-home assignment for **Onnorokom Projukti Limited — Assistant Software Engineer**.

First-come, first-served school admission with per-class seat capacity, temporary
holds, and confirmation/cancellation. Each class shift is a separate entity, as
the brief specifies.

## Quick start

Requires only **Docker** and **Docker Compose**.

```bash
docker compose up --build
```

Wait for all three services to start, then open:

| URL | What |
|---|---|
| http://localhost:3001 | React parent portal + admin panel |
| http://localhost:8080 | Backend API |
| http://localhost:8080/health | Health check |

Sample classes and holds are pre-seeded on first run so you can try the flow
immediately. To start empty, edit `docker-compose.yml` and remove
`ENABLE_DEMO_SEED: "true"`.

> **Ports:** frontend runs on **3001** (not 3000) to avoid conflicts with Grafana.
> If 3001 is taken, run `FRONTEND_PORT=3005 docker compose up --build` and open
> `http://localhost:3005`.

## Architecture

```
React (Vite + Tailwind)  ──HTTP──▶  ASP.NET Core API  ──EF Core──▶  PostgreSQL
```

Backend projects with strict dependency direction:

- `Domain` — entities, enums, exceptions. No dependencies.
- `Application` — DTOs and service interfaces.
- `Infrastructure` — DbContext, EF configs, migrations, services.
- `Api` — controllers, middleware, `Program.cs`.
- `Tests` — xUnit + Testcontainers.

## API endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/classes` | Create a class |
| GET | `/classes` | List with held/confirmed/available counts |
| GET | `/classes/{id}` | One class |
| POST | `/classes/{id}/holds` | Create a hold — requires `X-Student-Id` header |
| GET | `/holds/{id}` | Hold status |
| POST | `/holds/{id}/confirm` | Confirm — requires `X-Student-Id` |
| DELETE | `/holds/{id}` | Cancel — requires `X-Student-Id` |
| GET | `/me/holds` | Student's holds — requires `X-Student-Id` |

`X-Student-Id` must be exactly 17 ASCII digits.

## Concurrency

Every hold creation runs in a single PostgreSQL transaction that acquires the
class row with `SELECT ... FOR UPDATE`, then recomputes held and confirmed
counts inside that lock, and only then inserts. A partial unique index on
`(ClassId, StudentId) WHERE Status IN ('HELD','CONFIRMED')` prevents duplicate
active holds in the same class at the database level. Concurrent requests
serialize at the row lock, so overbooking is impossible even across multiple
backend processes sharing one database.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_DB` | `school_admission` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `HOLD_DURATION_SECONDS` | `600` | Hold duration in seconds |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend URL for the browser |
| `FRONTEND_PORT` | `3001` | Host port for the frontend |
| `ENABLE_DEMO_SEED` | unset | Seed 4 classes with sample holds on first run |
| `ADMIN_API_KEY` | unset | If set, `/admin/*` and `PUT /classes` require `X-Admin-Key` |

## Tests

```bash
dotnet test
```

25 tests across 6 classes: basic CRUD, hold lifecycle, input validation, admin
stats/pagination, concurrency. The concurrency test fires 20 simultaneous HTTP
requests against a 5-seat class and asserts exactly 5 succeed with 201 and 15
fail with 409 — proving the row lock prevents overbooking.

```bash
dotnet test --filter "FullyQualifiedName~HoldConcurrencyTests"
```

Uses Testcontainers to spin up a fresh PostgreSQL per test class — never touches
your local database.

## Project structure

```
school-admission-system/
├── backend/
│   ├── SchoolAdmission.Api/             # Controllers, middleware, Program.cs
│   ├── SchoolAdmission.Application/     # DTOs, service interfaces
│   ├── SchoolAdmission.Domain/          # Entities, enums, exceptions
│   ├── SchoolAdmission.Infrastructure/  # DbContext, EF config, migrations, services
│   └── SchoolAdmission.Tests/           # xUnit integration tests
├── frontend/
│   └── src/
│       ├── api/                         # Axios client
│       ├── components/                  # Reusable UI
│       ├── contexts/                    # Theme, Toast, StudentId
│       ├── hooks/                       # useStudentId
│       ├── layouts/                     # PublicLayout, AdminLayout
│       ├── pages/                       # Classes, MyHolds, admin/*
│       ├── types/                       # TypeScript interfaces
│       └── utils/                       # Validators, mask
├── docker-compose.yml                   # Postgres + backend + frontend
├── README.md
├── ASSUMPTIONS.md
└── AI_USAGE.md
```

## Documentation

- [`ASSUMPTIONS.md`](ASSUMPTIONS.md) — design decisions
- [`AI_USAGE.md`](AI_USAGE.md) — AI tool disclosure