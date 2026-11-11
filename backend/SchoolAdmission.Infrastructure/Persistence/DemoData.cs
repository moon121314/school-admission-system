using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;

namespace SchoolAdmission.Infrastructure.Persistence;

/// <summary>
/// Optional demo seed. Runs once at startup when ENABLE_DEMO_SEED=true.
///
/// Rules respected:
///  - Only seeds if the DB is empty (never overwrites existing data).
///  - Creates classes AND holds via the same entities the real services use —
///    the seat counts are consistent because they go through the same
///    partial unique index and status transitions.
///  - The holds are created directly here because the real HoldService
///    requires an HttpContext-derived student ID; the DB shape is identical.
/// </summary>
public static class DemoData
{
    public static async Task SeedAsync(AdmissionDbContext db, CancellationToken ct = default)
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("ENABLE_DEMO_SEED"),
                "true", StringComparison.OrdinalIgnoreCase))
            return;

        if (await db.AdmissionClasses.AnyAsync(ct)) return; // never touch non-empty DB

        var now = DateTimeOffset.UtcNow;

        var classes = new[]
        {
            new AdmissionClass { Name = "Class 6 - Morning Shift", TotalSeats = 120, CreatedAt = now },
            new AdmissionClass { Name = "Class 6 - Day Shift",     TotalSeats = 100, CreatedAt = now },
            new AdmissionClass { Name = "Class 7 - Morning Shift", TotalSeats = 90,  CreatedAt = now },
            new AdmissionClass { Name = "Class 8 - Morning Shift", TotalSeats = 60,  CreatedAt = now },
        };
        db.AdmissionClasses.AddRange(classes);
        await db.SaveChangesAsync(ct);

        // Create holds through the entities so seat counts come out consistent.
        var holds = new List<AdmissionHold>();

        void AddConfirmed(AdmissionClass cls, string studentId, int minutesAgo)
        {
            var created = now.AddMinutes(-minutesAgo);
            holds.Add(new AdmissionHold
            {
                ClassId = cls.Id,
                StudentId = studentId,
                Status = HoldStatus.CONFIRMED,
                CreatedAt = created,
                ExpiresAt = created.AddMinutes(10),
                ConfirmedAt = created.AddMinutes(2),
            });
        }

        void AddActiveHold(AdmissionClass cls, string studentId, int minutesAgo)
        {
            var created = now.AddMinutes(-minutesAgo);
            holds.Add(new AdmissionHold
            {
                ClassId = cls.Id,
                StudentId = studentId,
                Status = HoldStatus.HELD,
                CreatedAt = created,
                ExpiresAt = now.AddMinutes(8), // 8 minutes left — visible countdown
            });
        }

        // Class 6 morning: 15 confirmed + 8 active holds (23/120 used)
        for (int i = 0; i < 15; i++)
            AddConfirmed(classes[0], $"6000000000000{i:D4}", 30 + i);
        for (int i = 0; i < 8; i++)
            AddActiveHold(classes[0], $"6000000000009{i:D4}", 2 + i);

        // Class 6 day: 40 confirmed (40/100 used)
        for (int i = 0; i < 40; i++)
            AddConfirmed(classes[1], $"6100000000000{i:D4}", 60 + i);

        // Class 7 morning: 88 confirmed + 2 active (90/90 = full)
        for (int i = 0; i < 88; i++)
            AddConfirmed(classes[2], $"7000000000000{i:D4}", 45 + i);
        for (int i = 0; i < 2; i++)
            AddActiveHold(classes[2], $"7000000000098{i:D4}", 1 + i);

        // Class 8 morning: empty (0/60 used) — visible as fully available

        db.AdmissionHolds.AddRange(holds);
        await db.SaveChangesAsync(ct);
    }
}