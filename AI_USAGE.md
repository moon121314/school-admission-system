# AI Usage

## Tool used

**ChatGPT** — pair-programming and code review.

## Where AI assistance was used

- Extracting requirements from the assignment PDF into a checklist.
- Drafting `ASSUMPTIONS.md`, this file, and `README.md`.
- Generating scaffolding commands and C# / React source files.
- Drafting the xUnit integration tests, including the concurrency harness.
- Reviewing and refactoring the hold-service transaction logic.

## What was NOT delegated

- Running `dotnet`, `npm`, `docker compose`, `git`, `gh`, `curl` — all commands
  were executed on my own machine, with real output reviewed.
- Verifying every file compiles — done by running `dotnet build`, `npm run build`,
  and `dotnet test`.
- Any claim of manual verification corresponds to a command whose output I saw.

## Real AI mistakes caught and fixed

1. **Batched scaffolding commands broke the shell.** A multi-line `dotnet new`
   paste failed with `zsh: parse error near ')'`. Fixed by running each command
   individually.

2. **Wrong solution filename.** Early build instructions referenced
   `SchoolAdmission.sln`; the .NET 10 SDK produces `.slnx`. Fixed by using
   `dotnet build` (auto-detect).

3. **`Microsoft.EntityFrameworkCore.Design 11.0.0` incompatible with .NET 10.**
   Unversioned `dotnet add package` picked 11.0.0 which targets net11.0. Fixed
   by pinning `--version 10.0.4` on both Infrastructure and Api.

4. **Swashbuckle 11.0.0 conflicts with Microsoft.OpenApi.** `NU1107` at build.
   Fixed by removing Swashbuckle and using .NET 10's built-in `AddOpenApi()`.

5. **Enums serialized as integers.** API returned `{"status":0}` instead of
   `{"status":"HELD"}`. Fixed by adding `JsonStringEnumConverter` in
   `Program.cs` and `[JsonConverter(typeof(JsonStringEnumConverter))]` on the
   `HoldStatus` enum.

6. **`[property: Required]` on a record's positional parameters threw at
   runtime** (ASP.NET model binder rejects the attribute placement). Fixed by
   converting `ClassCreateRequest` to a plain class with settable properties.

7. **Rolling back a committed transaction.** In `ConfirmAsync`, the
   expired-hold branch committed then threw `ConflictException`, and the catch
   block tried to roll back an already-committed transaction — 500 instead of
   409. Fixed by tracking a `committed` flag and skipping rollback when true.

8. **Rate limiter broke the concurrency test.** 20 concurrent writes hit the
   10/min limiter and were rejected with 429 before reaching the service
   layer, making the test fail. Fixed by reading `DISABLE_RATE_LIMIT` env var
   in `Program.cs` and setting it from `ApiFactory` in tests.

9. **Missing `Icons.tsx` after a partial file paste.** Build failed with
   `Cannot find module './Icons'` in six files. Caught by `npm run build` and
   fixed by creating the missing file.

10. **Stale Docker image served the wrong frontend.** `docker compose up`
    without `--build` used the cached image; the browser showed the old UI.
    Fixed by always rebuilding: `docker compose down && docker compose up --build`.

11. **Strict per-student hold rule contradicted the PDF.** The brief scopes the
    duplicate-hold rule to "একটা class-এ" (one class), but a revision made it
    global. Caught by re-reading the PDF during final audit and reverted to a
    per-class partial unique index on `(ClassId, StudentId)`.

Every fix above was verified by re-running the failing command and seeing it
succeed. No mistakes are invented for this document.