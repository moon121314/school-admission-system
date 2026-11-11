using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Persistence;

namespace SchoolAdmission.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly AdmissionDbContext _db;
    private readonly TimeProvider _time;

    public AdminService(AdmissionDbContext db, TimeProvider time)
    {
        _db = db;
        _time = time;
    }

    public async Task<AdminStatsResponse> GetStatsAsync(CancellationToken ct)
    {
        var now = _time.GetUtcNow();
        var soon = now.AddMinutes(5);

        var classes = await _db.AdmissionClasses
            .AsNoTracking()
            .Select(c => new
            {
                c.TotalSeats,
                Held = c.Holds.Count(h => h.Status == HoldStatus.HELD && h.ExpiresAt > now),
                Confirmed = c.Holds.Count(h => h.Status == HoldStatus.CONFIRMED),
            })
            .ToListAsync(ct);

        var totalClasses = classes.Count;
        var totalSeats = classes.Sum(c => c.TotalSeats);
        var held = classes.Sum(c => c.Held);
        var confirmed = classes.Sum(c => c.Confirmed);
        var available = totalSeats - held - confirmed;
        if (available < 0) available = 0;

        var expiringSoon = await _db.AdmissionHolds.CountAsync(h =>
            h.Status == HoldStatus.HELD && h.ExpiresAt > now && h.ExpiresAt <= soon, ct);

        var totalHolds = await _db.AdmissionHolds.CountAsync(ct);

        return new AdminStatsResponse(
            totalClasses, totalSeats, held, confirmed,
            available, expiringSoon, totalHolds);
    }

    public async Task<PagedResponse<AdminHoldRow>> ListHoldsAsync(
        int page, int pageSize, string? status, int? classId, CancellationToken ct)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        IQueryable<Domain.Entities.AdmissionHold> query = _db.AdmissionHolds.AsNoTracking();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<HoldStatus>(status, true, out var parsed))
            query = query.Where(h => h.Status == parsed);

        if (classId is int cid)
            query = query.Where(h => h.ClassId == cid);

        var total = await query.CountAsync(ct);
        var totalPages = total == 0 ? 0 : (int)Math.Ceiling((double)total / pageSize);
        if (totalPages > 0 && page > totalPages) page = totalPages;

        var items = await query
            .OrderByDescending(h => h.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new AdminHoldRow(
                h.Id,
                h.ClassId,
                h.Class.Name,
                h.StudentId,
                h.Status.ToString(),
                h.CreatedAt,
                h.ExpiresAt,
                h.ConfirmedAt,
                h.CancelledAt))
            .ToListAsync(ct);

        return new PagedResponse<AdminHoldRow>(items, total, page, pageSize, totalPages);
    }
}