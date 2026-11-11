using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Domain.Exceptions;
using SchoolAdmission.Infrastructure.Persistence;

namespace SchoolAdmission.Infrastructure.Services;

public class HoldOptions { public int HoldDurationSeconds { get; set; } = 600; }

public class HoldService : IHoldService
{
    private readonly AdmissionDbContext _db;
    private readonly TimeProvider _time;
    private readonly TimeSpan _holdDuration;

    public HoldService(AdmissionDbContext db, TimeProvider time, HoldOptions options)
    {
        _db = db;
        _time = time;
        _holdDuration = TimeSpan.FromSeconds(options.HoldDurationSeconds);
    }

    public async Task<HoldCreatedResponse> CreateAsync(int classId, string studentId, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        bool committed = false;
        try
        {
            var cls = await _db.AdmissionClasses
                .FromSqlInterpolated($"SELECT * FROM admission_classes WHERE \"Id\" = {classId} FOR UPDATE")
                .FirstOrDefaultAsync(ct);
            if (cls is null) throw new NotFoundException($"Class {classId} not found.");

            var now = _time.GetUtcNow();

            var expired = await _db.AdmissionHolds
                .Where(h => h.ClassId == classId && h.Status == HoldStatus.HELD && h.ExpiresAt <= now)
                .ToListAsync(ct);
            foreach (var h in expired) h.Status = HoldStatus.EXPIRED;

            var duplicate = await _db.AdmissionHolds.AnyAsync(h =>
                h.ClassId == classId && h.StudentId == studentId &&
                (h.Status == HoldStatus.HELD || h.Status == HoldStatus.CONFIRMED), ct);
            if (duplicate) throw new ConflictException("You already have an active admission in this class.");

            var held = await _db.AdmissionHolds.CountAsync(h =>
                h.ClassId == classId && h.Status == HoldStatus.HELD && h.ExpiresAt > now, ct);
            var confirmed = await _db.AdmissionHolds.CountAsync(h =>
                h.ClassId == classId && h.Status == HoldStatus.CONFIRMED, ct);
            if (held + confirmed >= cls.TotalSeats) throw new ConflictException("Class is full.");

            var hold = new AdmissionHold
            {
                ClassId = classId, StudentId = studentId,
                Status = HoldStatus.HELD,
                CreatedAt = now, ExpiresAt = now + _holdDuration,
            };
            _db.AdmissionHolds.Add(hold);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            committed = true;
            return new HoldCreatedResponse(hold.Id, hold.ClassId, hold.StudentId, hold.Status, hold.ExpiresAt);
        }
        catch
        {
            if (!committed) await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<HoldDetailResponse> GetAsync(int holdId, CancellationToken ct)
    {
        var hold = await _db.AdmissionHolds.AsNoTracking().FirstOrDefaultAsync(h => h.Id == holdId, ct);
        if (hold is null) throw new NotFoundException($"Hold {holdId} not found.");
        if (hold.Status == HoldStatus.HELD && hold.ExpiresAt <= _time.GetUtcNow())
            hold.Status = HoldStatus.EXPIRED;
        return new HoldDetailResponse(hold.Id, hold.ClassId, hold.StudentId, hold.Status, hold.ExpiresAt);
    }

    public async Task<ConfirmResponse> ConfirmAsync(int holdId, string studentId, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        bool committed = false;
        try
        {
            var hold = await _db.AdmissionHolds
                .FromSqlInterpolated($"SELECT * FROM admission_holds WHERE \"Id\" = {holdId} FOR UPDATE")
                .FirstOrDefaultAsync(ct);
            if (hold is null) throw new NotFoundException($"Hold {holdId} not found.");
            if (hold.StudentId != studentId) throw new ForbiddenException("This hold belongs to another student.");

            if (hold.Status == HoldStatus.CONFIRMED)
            {
                await tx.CommitAsync(ct);
                committed = true;
                return new ConfirmResponse(hold.Id, hold.Status);
            }

            var now = _time.GetUtcNow();

            if (hold.Status == HoldStatus.HELD && hold.ExpiresAt <= now)
            {
                hold.Status = HoldStatus.EXPIRED;
                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
                committed = true;
                throw new ConflictException("Hold has expired and cannot be confirmed.");
            }

            if (hold.Status != HoldStatus.HELD)
                throw new ConflictException($"Hold is {hold.Status}; cannot confirm.");

            hold.Status = HoldStatus.CONFIRMED;
            hold.ConfirmedAt = now;
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            committed = true;
            return new ConfirmResponse(hold.Id, hold.Status);
        }
        catch
        {
            if (!committed) await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task CancelAsync(int holdId, string studentId, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        bool committed = false;
        try
        {
            var hold = await _db.AdmissionHolds
                .FromSqlInterpolated($"SELECT * FROM admission_holds WHERE \"Id\" = {holdId} FOR UPDATE")
                .FirstOrDefaultAsync(ct);
            if (hold is null) throw new NotFoundException($"Hold {holdId} not found.");
            if (hold.StudentId != studentId) throw new ForbiddenException("This hold belongs to another student.");

            if (hold.Status == HoldStatus.CANCELLED) { await tx.CommitAsync(ct); committed = true; return; }
            if (hold.Status != HoldStatus.HELD) throw new ConflictException($"Hold is {hold.Status}; cannot cancel.");

            hold.Status = HoldStatus.CANCELLED;
            hold.CancelledAt = _time.GetUtcNow();
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            committed = true;
        }
        catch
        {
            if (!committed) await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<IReadOnlyList<MyHoldResponse>> ListMineAsync(string studentId, CancellationToken ct)
    {
        var now = _time.GetUtcNow();
        var rows = await _db.AdmissionHolds.AsNoTracking()
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAt)
            .Select(h => new { h.Id, h.ClassId, h.Status, h.ExpiresAt, ClassName = h.Class.Name })
            .ToListAsync(ct);

        return rows.Select(r =>
        {
            var status = r.Status;
            if (status == HoldStatus.HELD && r.ExpiresAt <= now) status = HoldStatus.EXPIRED;
            return new MyHoldResponse(r.Id, r.ClassId, r.ClassName, status, r.ExpiresAt);
        }).ToList();
    }
}