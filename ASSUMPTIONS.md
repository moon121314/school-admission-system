# Assumptions

The assignment brief intentionally leaves several details open. This document
records every non-obvious decision made during implementation, along with the
reasoning behind it.

## Student identity

A student is identified by a 17-character birth registration number sent in the
`X-Student-Id` HTTP header. The value is validated as exactly 17 ASCII digits
after trimming surrounding whitespace. Malformed or missing headers return
HTTP 400. No authentication is implemented beyond this header, matching the
brief's explicit statement that no login is required.

The header value is persisted in browser `localStorage` under the key
`studentId`. This allows the student's active applications to survive a page
refresh or a browser restart without re-entering the identifier.

## Class model

Every class shift is modelled as a separate `AdmissionClass` row with its own
`TotalSeats`, consistent with the brief's instruction that each shift is a
distinct class. Class names are free text and are not unique; the database ID
is the canonical identifier.

`totalSeats` is capped at 2000. Real school classes do not exceed this size, and
the cap prevents accidental entry of extreme values (for example, 999999999)
that would create unusable records. Requests above the cap return HTTP 400.

Classes cannot be deleted through the API. The brief does not require deletion,
and removing a class that has existing holds would orphan those rows.

## Hold lifecycle

A hold begins in the `HELD` state and transitions to one of `CONFIRMED`,
`EXPIRED`, or `CANCELLED`. There are no other transitions. `CONFIRMED`,
`EXPIRED`, and `CANCELLED` are terminal.

The hold duration is configured through the `HOLD_DURATION_SECONDS` environment
variable. The default is 600 seconds (10 minutes).

Expired holds are handled through lazy evaluation. A hold is considered expired
when its status is `HELD` and its `ExpiresAt` timestamp is in the past. Every
read and write recomputes active counts with this rule, so an expired hold
never occupies a seat. When a write occurs on the same class, expired holds are
flipped to `EXPIRED` inside the same transaction. No background job is required.

The assignment brief states that a student may not hold more than one active
application in a single class. This is enforced at two independent layers:

1. `HoldService.CreateAsync` performs a duplicate check on `(ClassId, StudentId)`
   inside the class-row lock, so the check is race-free.
2. A partial unique index on `(ClassId, StudentId)` where status is `HELD` or
   `CONFIRMED` guarantees that even a bypassed service-layer check cannot insert
   a duplicate at the database level.

A student may hold active applications in different classes simultaneously. The
brief scopes the restriction to a single class, so cross-class holds are
permitted by design. This allows a parent to apply for Class 6 Morning as a
backup while attempting Class 7 Morning.

## Seat calculation

For any class, the following formulas are used consistently across every
endpoint that returns seat data:

- `heldSeats` = number of `HELD` holds whose `ExpiresAt` is in the future
- `confirmedSeats` = number of `CONFIRMED` holds
- `availableSeats = totalSeats - heldSeats - confirmedSeats`

The calculation is performed inside the same transaction as any state change, so
concurrent reads and writes never observe an inconsistent count.

## Confirmation

Only the owner of a hold can confirm it. Requests from a different student
return HTTP 403.

A hold may be confirmed only while it is in the `HELD` state and its `ExpiresAt`
is in the future. Attempts to confirm an expired or cancelled hold return
HTTP 409.

Confirming an already-confirmed hold is idempotent. The response is HTTP 200
with status `CONFIRMED`, and no counter changes. This matches the brief's
requirement that repeated confirmations must not increase `confirmedSeats`
more than once.

## Cancellation

Only the owner of a hold can cancel it. Requests from a different student
return HTTP 403.

A hold may be cancelled only while it is in the `HELD` state. A confirmed
admission cannot be cancelled, consistent with the brief's treatment of
confirmed seats as permanent.

Cancelling an already-cancelled hold returns HTTP 204. This idempotency avoids
spurious errors when a client retries a cancellation.

## Payment

The "pay admission fee" action is a simulated confirmation. It calls
`POST /holds/{id}/confirm` and returns the same response a real payment
integration would. No real payment gateway is integrated, as the brief
explicitly does not require one.

## Concurrency

The brief requires that `held + confirmed` never exceeds `totalSeats`,
regardless of how many requests arrive simultaneously.

This implementation uses PostgreSQL row-level locking as the primary mechanism.
Every operation that could change the seat count runs inside a transaction that
acquires the target row with `SELECT ... FOR UPDATE`:

- `POST /classes/{classId}/holds` locks the `admission_classes` row for the
  target class. Concurrent creates for the same class block at this lock. The
  second request re-reads the counts after the first commits and correctly
  rejects with HTTP 409 if the class is now full.
- `POST /holds/{holdId}/confirm` and `DELETE /holds/{holdId}` lock the
  `admission_holds` row for the target hold. Concurrent attempts to modify the
  same hold block at this lock; only one commits a state change.

Because the lock is acquired through PostgreSQL, this guarantee also applies
when two backend processes run on different ports but share the same database.
Both processes contend for the same row lock. The second process blocks until
the first commits, then re-reads the seat counts. Overbooking is impossible
across processes because the database — not the application — enforces the
serialisation.

A partial unique index on `(ClassId, StudentId)` provides a second layer of
defence for the duplicate-hold rule, independent of any application logic.

## Rate limiting

Write endpoints are limited to 10 requests per minute per client IP.
Read endpoints are limited to 120 requests per minute per client IP. Requests
that exceed these limits receive HTTP 429 with a JSON error message.

The limits protect the service against scripted abuse and against self-inflicted
overload during aggressive testing. A legitimate parent needs only a small
number of writes per session, so the limits do not affect normal use.

Setting the `DISABLE_RATE_LIMIT` environment variable to `true` disables both
limiters. The integration tests set this variable because the concurrency test
intentionally fires 20 simultaneous writes; without the override, those
requests would be rejected by the limiter before reaching the service layer,
making the test measure the wrong thing.

## Admin access

An optional shared-secret gate protects administrative endpoints. If the
`ADMIN_API_KEY` environment variable is set, requests to `/admin/*` and
`PUT /classes/{id}` must include a matching `X-Admin-Key` header. If the
variable is unset, admin endpoints remain public.

This approach aligns with the brief's no-login scope while allowing a real
deployment to secure administrative operations with a single environment
variable change.

## Frontend behaviour

The student identifier is shared across all components through a React context
(`StudentIdProvider`) so that the top bar, the class listing, and the
applications page all reflect the same identity in real time.

Seat counts on the class listing refresh every 3 seconds. Admin pages refresh
every 5 seconds. No page reload is required.

Hold expiry is evaluated on the client by comparing `expiresAt` to the current
time once per second. When a hold expires, the UI immediately reflects the
`EXPIRED` state and disables the confirmation action. The server independently
enforces the same rule, so the UI cannot force a confirmation of an expired
hold by manipulating the browser clock.

API errors are surfaced as toast notifications. Server-provided error messages
are displayed directly for HTTP 400, 403, 404, and 409 responses.

## Demo seed

When `ENABLE_DEMO_SEED=true` is set, the application creates four sample classes
and a representative set of holds on first startup. The seed runs only when the
database is empty, so it never overwrites existing data.

The seed creates real database rows using the same entity types and constraints
as the production code. All dashboard statistics and seat counts are computed
from those rows by the same service methods used in normal operation. No fake
or mocked responses are used.

## Out of scope

The following are excluded per the brief:

- Authentication and authorisation beyond the `X-Student-Id` header
- Email and SMS notifications
- Real payment gateway integration
- Multiple currencies or partial refunds
- Administrative deletion of individual application records