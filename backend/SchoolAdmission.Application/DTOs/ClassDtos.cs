using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.Application.DTOs;

public class ClassCreateRequest
{
    [Required(ErrorMessage = "name is required")]
    [StringLength(200, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "totalSeats must be > 0")]
    public int TotalSeats { get; set; }
}

public class ClassUpdateRequest
{
    [Required(ErrorMessage = "name is required")]
    [StringLength(200, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "totalSeats must be > 0")]
    public int TotalSeats { get; set; }
}

public record ClassResponse(
    int Id,
    string Name,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats);