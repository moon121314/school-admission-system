using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Application.Interfaces;

public interface IClassService
{
    Task<ClassResponse> CreateAsync(ClassCreateRequest request, CancellationToken ct);
    Task<IReadOnlyList<ClassResponse>> ListAsync(CancellationToken ct);
    Task<ClassResponse> GetAsync(int classId, CancellationToken ct);
}