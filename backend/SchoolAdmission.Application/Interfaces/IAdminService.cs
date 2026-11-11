using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Application.Interfaces;

public interface IAdminService
{
    Task<AdminStatsResponse> GetStatsAsync(CancellationToken ct);

    Task<PagedResponse<AdminHoldRow>> ListHoldsAsync(
        int page,
        int pageSize,
        string? status,
        int? classId,
        CancellationToken ct);
}