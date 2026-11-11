using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.Application.DTOs;

public record ClassCreateRequest(
    [property: Required(ErrorMessage = "name is required")]
    [property: StringLength(200, MinimumLength = 1)]
    string Name,

    [property: Range(1, int.MaxValue, ErrorMessage = "totalSeats must be > 0")]
    int TotalSeats
);

public record ClassResponse(
    int Id, string Name, int TotalSeats,
    int HeldSeats, int ConfirmedSeats, int AvailableSeats);