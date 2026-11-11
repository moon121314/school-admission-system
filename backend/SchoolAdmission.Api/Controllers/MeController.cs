using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Extensions;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("me")]
public class MeController : ControllerBase
{
    private readonly IHoldService _service;
    public MeController(IHoldService service) => _service = service;

    [HttpGet("holds")]
    public async Task<ActionResult<IReadOnlyList<MyHoldResponse>>> MyHolds(CancellationToken ct)
    {
        string studentId = HttpContext.RequireStudentId();
        return Ok(await _service.ListMineAsync(studentId, ct));
    }
}