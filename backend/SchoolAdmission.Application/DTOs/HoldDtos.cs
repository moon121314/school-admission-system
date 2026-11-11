using SchoolAdmission.Domain.Enums;

namespace SchoolAdmission.Application.DTOs;

public record HoldCreatedResponse(
    int HoldId, int ClassId, string StudentId,
    HoldStatus Status, DateTimeOffset ExpiresAt);

public record HoldDetailResponse(
    int HoldId, int ClassId, string StudentId,
    HoldStatus Status, DateTimeOffset ExpiresAt);

public record ConfirmResponse(int HoldId, HoldStatus Status);

public record MyHoldResponse(
    int HoldId, int ClassId, string ClassName,
    HoldStatus Status, DateTimeOffset ExpiresAt);