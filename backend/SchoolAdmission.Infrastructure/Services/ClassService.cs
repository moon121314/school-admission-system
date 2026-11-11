using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Domain.Exceptions;
using SchoolAdmission.Infrastructure.Persistence;

namespace SchoolAdmission.Infrastructure.Services;

public class ClassService : IClassService
{
    private readonly AdmissionDbContext _db;
    public ClassService(AdmissionDbContext db) => _db = db;

    public async Task<ClassResponse> CreateAsync(ClassCreateRequest request, CancellationToken ct)
    {
        var cls = new AdmissionClass
        {
            Name = request.Name.Trim(),
            TotalSeats = request.TotalSeats,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        _db.AdmissionClasses.Add(cls);
        await _db.SaveChangesAsync(ct);
        return new ClassResponse(cls.Id, cls.Name, cls.TotalSeats, 0, 0, cls.TotalSeats);
    }

    public async Task<IReadOnlyList<ClassResponse>> ListAsync(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var rows = await _db.AdmissionClasses
            .AsNoTracking().OrderBy(c => c.Id)
            .Select(c => new
            {
                c.Id, c.Name, c.TotalSeats,
                Held = c.Holds.Count(h => h.Status == HoldStatus.HELD && h.ExpiresAt > now),
                Confirmed = c.Holds.Count(h => h.Status == HoldStatus.CONFIRMED),
            }).ToListAsync(ct);

        return rows.Select(r => new ClassResponse(
            r.Id, r.Name, r.TotalSeats, r.Held, r.Confirmed,
            r.TotalSeats - r.Held - r.Confirmed)).ToList();
    }

    public async Task<ClassResponse> GetAsync(int classId, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var result = await _db.AdmissionClasses.AsNoTracking()
            .Where(c => c.Id == classId)
            .Select(c => new
            {
                c.Id, c.Name, c.TotalSeats,
                Held = c.Holds.Count(h => h.Status == HoldStatus.HELD && h.ExpiresAt > now),
                Confirmed = c.Holds.Count(h => h.Status == HoldStatus.CONFIRMED),
            }).FirstOrDefaultAsync(ct);

        if (result is null) throw new NotFoundException($"Class {classId} not found.");
        return new ClassResponse(result.Id, result.Name, result.TotalSeats,
            result.Held, result.Confirmed,
            result.TotalSeats - result.Held - result.Confirmed);
    }
}