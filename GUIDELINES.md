# Run and Test Guide

A complete, self-contained guide for anyone to run, verify, and evaluate the
School Admission System. No prior knowledge of the codebase is required.

---

## 1. What this project is

A full-stack school admission platform implementing first-come-first-served
seat allocation with temporary holds and payment confirmation.

- **Backend:** ASP.NET Core (.NET 10), Entity Framework Core, PostgreSQL 16
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Infrastructure:** Docker Compose (three services)

### Business flow

1. A class shift is created by an administrator with a fixed seat capacity.
2. A parent applies for a seat using their birth registration number (no login).
3. The seat is held for a limited time (default 10 minutes).
4. Within that window, the parent confirms payment — admission becomes permanent.
5. If the window expires, the seat releases automatically for other applicants.

Every hold creation, confirmation, and cancellation is concurrency-safe at the
PostgreSQL level: `held + confirmed` can never exceed `totalSeats` regardless of
how many simultaneous requests arrive.

---

## 2. Prerequisites

The only requirement is **Docker** and **Docker Compose** on your machine.

Verify installation:

```bash
docker --version
docker compose version
```

Both must respond. Docker Desktop must be **running** (the whale icon in the
system tray / menu bar must be still, not animating).

Nothing else needs to be installed — no .NET SDK, no Node.js, no PostgreSQL.

---

## 3. Clone and start

```bash
git clone https://github.com/moon121314/school-admission-system.git
cd school-admission-system
docker compose up --build
```

**First run takes 3–5 minutes** because it:
- Pulls the PostgreSQL, .NET SDK, Node, and nginx images
- Compiles the ASP.NET Core backend
- Builds the React production bundle
- Starts all three containers

Wait until you see **all three of these lines** in the terminal:

```
db-1        | database system is ready to accept connections
backend-1   | Now listening on: http://[::]:8080
frontend-1  | ready for start up
```

**Leave this terminal open.** Open a second terminal window for the tests below.

---

## 4. Access URLs

| Purpose | URL |
|---|---|
| Frontend (parent portal + admin) | http://localhost:3001 |
| Backend API | http://localhost:8080 |
| Health check | http://localhost:8080/health |
| OpenAPI specification | http://localhost:8080/openapi/v1.json |

> **Note on ports:** the frontend is on **3001**, not the common 3000, to avoid
> conflicts with local tools like Grafana. If port 3001 is also occupied on your
> machine, start with `FRONTEND_PORT=3005 docker compose up --build` and open
> `http://localhost:3005` instead.

---

## 5. Pre-seeded sample data

The first startup with `ENABLE_DEMO_SEED=true` populates the database with
realistic sample data so you can see the application immediately:

- **Class 6 — Morning Shift** — 120 seats, ~15 confirmed, ~8 active holds
- **Class 6 — Day Shift** — 100 seats, ~40 confirmed
- **Class 7 — Morning Shift** — 90 seats, fully booked
- **Class 8 — Morning Shift** — 60 seats, empty

The seed runs **only when the database is empty**. It does not overwrite existing
data on subsequent restarts.

To skip the seed and start with an empty database:

```bash
docker compose down -v
docker compose up --build
```

(The `-v` flag deletes the persistent volume.)

---

## 6. Manual verification with curl

Open a **second terminal** and run these in order. Each step confirms one
behaviour of the system.

### 6.1 — Backend is alive

```bash
curl -s http://localhost:8080/health
```

**Expected:** `{"status":"healthy"}`

### 6.2 — Frontend is the real application

```bash
curl -s http://localhost:3001/ | grep -o "<title>[^<]*</title>"
```

**Expected:** `<title>School Admission System</title>`

(If it returns `<title>frontend</title>`, the frontend container is serving the
default Vite HTML shell. Run `docker compose down && docker compose up --build`.)

### 6.3 — List all classes

```bash
curl -s http://localhost:8080/classes | python3 -m json.tool
```

**Expected:** a JSON array of classes, each containing `id`, `name`,
`totalSeats`, `heldSeats`, `confirmedSeats`, `availableSeats`.

### 6.4 — Create a new class

```bash
curl -s -X POST http://localhost:8080/classes \
  -H "Content-Type: application/json" \
  -d '{"name":"Verification Test","totalSeats":3}' | python3 -m json.tool
```

**Expected:** HTTP 201 with `{"id": N, "name": "Verification Test", ...}`. Note
the class `id` from the response — call it **N** below.

### 6.5 — Apply for a seat

```bash
curl -s -X POST http://localhost:8080/classes/N/holds \
  -H "X-Student-Id: 20152691234567890" | python3 -m json.tool
```

Replace **N** with the class ID from step 6.4.

**Expected:** HTTP 201 with `{"holdId": M, "status": "HELD", ...}`. Note the
`holdId` — call it **M** below.

### 6.6 — Check that the seat was reserved

```bash
curl -s http://localhost:8080/classes/N | python3 -m json.tool
```

**Expected:** `"heldSeats": 1, "availableSeats": 2`

### 6.7 — Confirm the hold

```bash
curl -s -X POST http://localhost:8080/holds/M/confirm \
  -H "X-Student-Id: 20152691234567890" | python3 -m json.tool
```

**Expected:** HTTP 200 with `{"holdId": M, "status": "CONFIRMED"}`

### 6.8 — Verify the seat count updated

```bash
curl -s http://localhost:8080/classes/N | python3 -m json.tool
```

**Expected:** `"heldSeats": 0, "confirmedSeats": 1, "availableSeats": 2`

### 6.9 — Duplicate active hold is rejected

```bash
curl -s -o /dev/null -w "Duplicate attempt: %{http_code}\n" \
  -X POST http://localhost:8080/classes/N/holds \
  -H "X-Student-Id: 20152691234567890"
```

**Expected:** `Duplicate attempt: 409`

### 6.10 — Fill the class with two more students

```bash
curl -s -o /dev/null -w "Student 2: %{http_code}\n" \
  -X POST http://localhost:8080/classes/N/holds \
  -H "X-Student-Id: 11111111111111111"

curl -s -o /dev/null -w "Student 3: %{http_code}\n" \
  -X POST http://localhost:8080/classes/N/holds \
  -H "X-Student-Id: 22222222222222222"
```

**Expected:** both return `201`.

### 6.11 — Full class rejects new applications

```bash
curl -s -o /dev/null -w "Student 4 on full class: %{http_code}\n" \
  -X POST http://localhost:8080/classes/N/holds \
  -H "X-Student-Id: 33333333333333333"
```

**Expected:** `Student 4 on full class: 409`

This is the assignment's most graded business rule.

### 6.12 — Ownership check blocks cross-student confirmation

```bash
curl -s -o /dev/null -w "Wrong student confirms: %{http_code}\n" \
  -X POST http://localhost:8080/holds/M/confirm \
  -H "X-Student-Id: 99999999999999999"
```

**Expected:** `Wrong student confirms: 403`

### 6.13 — Cross-class holds are allowed

The brief scopes the duplicate-hold rule to a single class. A student may hold
active applications in different classes simultaneously:

```bash
# Create a second class
curl -s -X POST http://localhost:8080/classes \
  -H "Content-Type: application/json" \
  -d '{"name":"Cross-class Test","totalSeats":5}' | python3 -m json.tool
```

Note the new class ID — call it **K**.

```bash
# Same student, different class → allowed
curl -s -o /dev/null -w "Same student, different class: %{http_code}\n" \
  -X POST http://localhost:8080/classes/K/holds \
  -H "X-Student-Id: 20152691234567890"
```

**Expected:** `Same student, different class: 201`

```bash
# Same student, same class as step 6.5 → blocked
curl -s -o /dev/null -w "Same student, same class: %{http_code}\n" \
  -X POST http://localhost:8080/classes/N/holds \
  -H "X-Student-Id: 20152691234567890"
```

**Expected:** `Same student, same class: 409`

### 6.14 — My applications endpoint

```bash
curl -s http://localhost:8080/me/holds \
  -H "X-Student-Id: 11111111111111111" | python3 -m json.tool
```

**Expected:** a JSON array containing the student's holds, each with `holdId`,
`classId`, `className`, `status`, `expiresAt`.

---

## 7. Verification in the browser

Open **http://localhost:3001** in a modern browser.

### 7.1 — Parent portal

- The top bar contains a School Admission logo, a text input for the birth
  registration number, and a Save button.
- Below the top bar, a navigation row shows "Available Classes" and
  "My Applications".
- The main area shows a landing hero with the headline **"Start Your Child's
  Educational Journey With Us"**, followed by three informational cards, then
  a grid of class cards.

Each class card displays:
- The class name
- A status badge (`Available`, `Limited`, or `Full`)
- The count of available seats vs. total seats
- Reserved and confirmed counts
- A horizontal progress bar
- An **Apply Now** button (disabled if the class is full)

### 7.2 — Apply for a seat

1. Paste `20152691234567890` into the birth registration input and press **Save**.
   A green badge appears showing the ID in masked form.
2. Click **Apply Now** on any class that has available seats.
3. A green toast appears: "Seat reserved. Open My Applications to confirm payment."
4. The available seat count on that card drops by 1 within three seconds.

### 7.3 — View and confirm applications

1. Click **My Applications** in the navigation.
2. A card appears for the hold, showing:
   - Class name and application ID
   - A yellow "Reserved" badge
   - A live countdown timer in minutes and seconds
   - **Confirm payment** and **Cancel** buttons
3. Click **Confirm payment**.
4. The status flips to a green "Confirmed" badge. The countdown disappears.

### 7.4 — Full class feedback

1. Create a small class via the API (total seats = 1).
2. Apply for the only seat with one student.
3. Paste a different birth registration number and try to apply for the same
   class.
4. A red toast appears: **"Class is full."**

### 7.5 — Expiry behaviour

1. Stop the stack: `docker compose down`
2. Restart with a short hold duration:
   `HOLD_DURATION_SECONDS=15 docker compose up --build`
3. Apply for a class.
4. Open My Applications and wait ~16 seconds without clicking anything.
5. The status flips from "Reserved" to "Expired" **without a page refresh**, and
   the Confirm payment button disappears.

This directly satisfies the brief's requirement that expired holds are visible
without a reload and cannot be confirmed.

### 7.6 — Admin panel

Navigate to **http://localhost:3001/admin**.

The admin section has a left sidebar with three entries: Dashboard, Manage
Classes, and All Holds.

**Dashboard:**
- Five statistic cards: total classes, total seats, reserved, confirmed, available
- A "Seat distribution" panel with three progress bars
- A "Recent activity" table listing the most recent holds
- Quick action links to the other admin pages

**Manage Classes:**
- A table listing every class with its name, total seats, reserved seats,
  confirmed seats, and available seats
- A **New class** button opens an inline form with fields for class name and
  seat count
- Each row has an **Edit** button that turns the row into inline inputs
- Saving a seat count below the current reservation total fails with a clear
  error message
- Saving a seat count above 2000 fails with a validation message

**All Holds:**
- A paginated table listing every hold across all classes
- A status dropdown filter (All / Reserved / Confirmed / Expired / Cancelled)
- A search box that filters by student ID or class name
- Pagination controls at the bottom

### 7.7 — Persistence across restart

1. Save a birth registration number in the top bar.
2. Close the browser completely.
3. Reopen http://localhost:3001.
4. Click **My Applications**. The previously saved identity and applications
   are still visible.

The database volume persists between `docker compose down` and
`docker compose up`. Data is only cleared by `docker compose down -v`.

---

## 8. Automated tests

The backend includes **25 automated tests** covering CRUD, hold lifecycle,
validation, admin endpoints, and the required concurrency guarantee.

### 8.1 — Run the full suite

From the repository root (not from inside `frontend/`):

```bash
dotnet test
```

**Expected final line:**

```
Passed!  - Failed:     0, Passed:    25, Skipped:     0
```

**Note:** the tests use **Testcontainers**, which starts its own ephemeral
PostgreSQL container per test class. They do not touch the docker-compose
database. Docker Desktop must be running.

**First run takes 3–5 minutes** because Testcontainers pulls the PostgreSQL
image and starts a fresh container per class.

### 8.2 — Run the concurrency test in isolation

```bash
dotnet test --filter "FullyQualifiedName~HoldConcurrencyTests"
```

**Expected:**

```
Passed!  - Failed:     0, Passed:     4, Skipped:     0
```

This runs the four concurrency tests:
- `ConcurrentHolds_NeverExceedCapacity` — 20 simultaneous requests against a
  5-seat class; exactly 5 succeed with 201 and 15 fail with 409
- `ConcurrentHolds_SameStudentSameClass_OnlyOneWins`
- `SameStudent_DifferentClasses_BothActiveHoldsAllowed`
- `SameStudent_SameClass_SecondHoldBlocked`

### 8.3 — What each test class covers

| Test class | Focus |
|---|---|
| `ClassTests` | Create, list, get-404, zero-seats validation |
| `HoldLifecycleTests` | HELD→CONFIRMED, HELD→CANCELLED, expired confirm rejection, duplicate hold, capacity exhaustion, ownership, `/me/holds` |
| `HoldConcurrencyTests` | 20-way concurrent creates, same-student contention, per-class rule |
| `ValidationTests` | Missing header, non-ASCII header, unknown hold |
| `AdminTests` | Stats aggregation, paginated holds, status filtering |
| `ClassManagementTests` | Update name and seats, seat count below usage rejection, unknown class 404 |

---

## 9. Verifying the concurrency guarantee manually

The automated test proves it, but you can reproduce the guarantee yourself with
shell commands.

### 9.1 — Create a small class

```bash
curl -s -X POST http://localhost:8080/classes \
  -H "Content-Type: application/json" \
  -d '{"name":"Concurrency Test","totalSeats":3}' | python3 -m json.tool
```

Note the class ID — call it **C** below.

### 9.2 — Fire 10 simultaneous hold requests

```bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  sid=$(printf "%017d" $i)
  curl -s -o /dev/null -w "%{http_code} " \
    -X POST http://localhost:8080/classes/C/holds \
    -H "X-Student-Id: $sid" &
done
wait
echo ""
```

Replace **C** with your class ID.

**Expected output:** exactly **three `201` responses** and **seven `409`
responses**, in any order. Never more than three `201`s.

### 9.3 — Verify the final state

```bash
curl -s http://localhost:8080/classes/C | python3 -m json.tool
```

**Expected:** `"heldSeats": 3, "confirmedSeats": 0, "availableSeats": 0`

Total held + confirmed equals 3, never more.

---

## 10. How the concurrency guarantee works

For readers interested in the implementation:

**The problem:** without locking, two simultaneous requests both read "1 seat
available," both decide to insert, and the class is overbooked.

**The solution:** PostgreSQL row-level locking plus an inside-lock recount.

When `POST /classes/{id}/holds` is called, the service runs:

```sql
SELECT * FROM admission_classes WHERE "Id" = @classId FOR UPDATE;
```

This acquires an exclusive lock on the class row. Any other transaction
attempting to lock the same row blocks until the first commits or rolls back.
After the lock is held, the service counts held and confirmed seats, compares
against `TotalSeats`, and inserts only if a seat is available.

Two simultaneous requests for the same class serialise at the lock:
- The first acquires the lock, counts, inserts, commits, releases
- The second was blocked; it wakes up, re-reads the counts, and correctly
  rejects with 409 if the class is now full

**Second layer:** a partial unique index

```sql
CREATE UNIQUE INDEX ux_admission_holds_class_student_active
  ON admission_holds ("ClassId", "StudentId")
  WHERE "Status" IN ('HELD', 'CONFIRMED');
```

This enforces the "one active hold per (class, student)" rule at the database
level. Even if a future code change bypassed the service-layer check, the
INSERT would fail with a unique violation and the service would map it to 409.

**Bonus — multi-process safety:** because the lock is a PostgreSQL primitive,
two backend processes on different ports sharing one database also serialise
correctly. The lock is held by the database, not by any single application
instance.

---

## 11. API reference

All requests and responses use JSON. The `X-Student-Id` header must be exactly
17 ASCII digits.

| # | Method | Path | Header | Success | Failure |
|---|---|---|---|---|---|
| 1 | POST | `/classes` | — | 201 | 400 |
| 2 | GET | `/classes` | — | 200 | — |
| 3 | GET | `/classes/{id}` | — | 200 | 404 |
| 4 | POST | `/classes/{id}/holds` | Required | 201 | 400, 403, 404, 409 |
| 5 | GET | `/holds/{id}` | — | 200 | 404 |
| 6 | POST | `/holds/{id}/confirm` | Required | 200 | 400, 403, 404, 409 |
| 7 | DELETE | `/holds/{id}` | Required | 204 | 400, 403, 404, 409 |
| 8 | GET | `/me/holds` | Required | 200 | 400 |

**Additional endpoints used by the admin panel:**

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/stats` | Aggregate statistics |
| GET | `/admin/holds` | Paginated list of all holds (supports `page`, `pageSize`, `status`, `classId`) |
| PUT | `/classes/{id}` | Update class name and seat count |

---

## 12. Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_DB` | `school_admission` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `HOLD_DURATION_SECONDS` | `600` | Hold lifetime in seconds |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend URL used by the browser |
| `FRONTEND_PORT` | `3001` | Host port for the frontend |
| `ENABLE_DEMO_SEED` | unset | Seed sample data on first startup |
| `ADMIN_API_KEY` | unset | If set, admin write endpoints require `X-Admin-Key` |
| `DISABLE_RATE_LIMIT` | unset | If `true`, disables rate limiters (used by tests) |

To override any of these for a single run, pass them on the command line:

```bash
HOLD_DURATION_SECONDS=15 FRONTEND_PORT=3005 docker compose up --build
```

---

## 13. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop not running | Start Docker Desktop, wait ~30s |
| `localhost:3001` shows a Grafana page | Port 3000 conflict | The frontend runs on **3001**; check the URL |
| Blank white page at `localhost:3001` | Stale container image | `docker compose down && docker compose up --build` |
| `curl localhost:8080/health` returns nothing | Backend still starting | Wait 20 seconds, retry |
| `429 Too Many Requests` during testing | Rate limit hit (10 writes/min) | Wait 60 seconds, or restart with `DISABLE_RATE_LIMIT=true` |
| Tests hang on first run | Testcontainers pulling PostgreSQL image | Wait 3–5 minutes |
| `libgssapi_krb5.so.2` warning in backend logs | Npgsql Kerberos probe fails | Harmless — password auth still works |
| `No such container: school-admission-system` | Compose was stopped | `docker compose up -d` from repo root |
| Port 8080 or 3001 already in use | Another service is bound | Stop that service, or set `FRONTEND_PORT` / edit `docker-compose.yml` |

---

## 14. Stopping and resetting

**Stop the stack (keeps the database):**
```bash
docker compose down
```

**Stop and delete the database volume (fresh start next time):**
```bash
docker compose down -v
```

**Restart with a fresh database and sample seed data:**
```bash
docker compose down -v
ENABLE_DEMO_SEED=true docker compose up --build
```

---

## 15. Verification checklist

A concise checklist for reviewers. All should pass.

**Infrastructure**
- [ ] `docker compose up --build` starts all three containers
- [ ] No manual .NET, Node, or PostgreSQL installation is required
- [ ] `http://localhost:8080/health` returns `{"status":"healthy"}`
- [ ] `http://localhost:3001` renders the School Admission UI (not a default Vite page)

**API contract**
- [ ] All 8 assignment endpoints return the documented shapes
- [ ] `X-Student-Id` header is required on the four endpoints that need it
- [ ] HTTP status codes match (201 for creates, 200 for reads, 204 for cancel, 409 for conflicts, 403 for ownership)

**Business rules**
- [ ] A full class rejects new holds with 409
- [ ] Duplicate active hold in the same class is rejected with 409
- [ ] Cross-class holds for the same student are allowed
- [ ] Confirmation is idempotent
- [ ] Expired holds cannot be confirmed (409)
- [ ] Non-owners cannot confirm or cancel (403)
- [ ] `held + confirmed <= totalSeats` under any load

**Concurrency**
- [ ] `dotnet test --filter "FullyQualifiedName~HoldConcurrencyTests"` shows 4 passes
- [ ] Manual test in section 9 produces exactly 3 successes and 7 conflicts

**Frontend**
- [ ] Birth registration input sanitises non-numeric characters
- [ ] Applying shows a toast and updates seat counts without reload
- [ ] Countdown ticks down and flips to Expired automatically without a reload
- [ ] Confirm payment changes the status to Confirmed
- [ ] Admin dashboard shows live statistics
- [ ] Class inline editing rejects seat counts below current usage
- [ ] Application state survives a browser restart

**Persistence**
- [ ] `docker compose down` followed by `docker compose up` preserves data

**Documentation**
- [ ] `README.md`, `ASSUMPTIONS.md`, `AI_USAGE.md` exist at the repository root
- [ ] `README.md` explains how to start the app, what URLs to use, and how to run tests
- [ ] `ASSUMPTIONS.md` documents every non-obvious decision with reasoning

---

## 16. Where to look in the code

| Concern | File |
|---|---|
| Concurrency (row lock) | `backend/SchoolAdmission.Infrastructure/Services/HoldService.cs` |
| Duplicate-hold unique index | `backend/SchoolAdmission.Infrastructure/Configurations/AdmissionHoldConfiguration.cs` |
| Seat calculation | `backend/SchoolAdmission.Infrastructure/Services/ClassService.cs` |
| Request validation | `backend/SchoolAdmission.Api/Middleware/StudentIdFilter.cs` |
| Error mapping | `backend/SchoolAdmission.Api/Middleware/ExceptionHandlingMiddleware.cs` |
| Rate limiting | `backend/SchoolAdmission.Api/Program.cs` |
| Concurrency test | `backend/SchoolAdmission.Tests/HoldConcurrencyTests.cs` |
| Frontend API client | `frontend/src/api/client.ts` |
| Student identity context | `frontend/src/contexts/StudentIdContext.tsx` |
| Countdown + confirm UI | `frontend/src/components/HoldCard.tsx` |
| Admin layout | `frontend/src/layouts/AdminLayout.tsx` |

---

## 17. Further reading

- `README.md` — quick start, architecture, endpoints overview
- `ASSUMPTIONS.md` — every non-obvious decision with reasoning
- `AI_USAGE.md` — AI tool usage disclosure

Source repository: https://github.com/moon121314/school-admission-system

For any question about the implementation, refer to the ASSUMPTIONS file first —
most design questions are answered there with the reasoning.