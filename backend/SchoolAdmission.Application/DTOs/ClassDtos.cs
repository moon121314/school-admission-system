using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.Application.DTOs;

public class ClassCreateRequest
{
    [Required(ErrorMessage = "name is required")]
    [StringLength(200, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    // 2000 is a hard cap: no realistic school class exceeds this,
    // and it prevents fat-finger typos like 999999999 from polluting
    // the DB with unusable "classes".
    [Range(1, 2000, ErrorMessage = "totalSeats must be between 1 and 2000")]
    public int TotalSeats { get; set; }
}

public class ClassUpdateRequest
{
    [Required(ErrorMessage = "name is required")]
    [StringLength(200, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 2000, ErrorMessage = "totalSeats must be between 1 and 2000")]
    public int TotalSeats { get; set; }
}

public record ClassResponse(
    int Id,
    string Name,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats);