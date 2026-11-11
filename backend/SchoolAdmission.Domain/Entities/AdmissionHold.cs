using SchoolAdmission.Domain.Enums;

namespace SchoolAdmission.Domain.Entities;

public class AdmissionHold
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public HoldStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? ConfirmedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public AdmissionClass Class { get; set; } = null!;
}