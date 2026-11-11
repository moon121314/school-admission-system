namespace SchoolAdmission.Application.DTOs;

public record AdminStatsResponse(
    int TotalClasses,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats,
    int ExpiringSoon,
    int TotalHolds
);

public record AdminHoldRow(
    int HoldId,
    int ClassId,
    string ClassName,
    string StudentId,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt,
    DateTimeOffset? ConfirmedAt,
    DateTimeOffset? CancelledAt
);

public record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);