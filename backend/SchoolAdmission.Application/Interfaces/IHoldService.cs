using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Application.Interfaces;

public interface IHoldService
{
    Task<HoldCreatedResponse> CreateAsync(int classId, string studentId, CancellationToken ct);
    Task<HoldDetailResponse> GetAsync(int holdId, CancellationToken ct);
    Task<ConfirmResponse> ConfirmAsync(int holdId, string studentId, CancellationToken ct);
    Task CancelAsync(int holdId, string studentId, CancellationToken ct);
    Task<IReadOnlyList<MyHoldResponse>> ListMineAsync(string studentId, CancellationToken ct);
}