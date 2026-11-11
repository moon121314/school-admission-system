using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Middleware;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("admin")]
[TypeFilter(typeof(AdminKeyFilter))]
public class AdminController : ControllerBase
{
    private readonly IAdminService _service;
    public AdminController(IAdminService service) => _service = service;

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsResponse>> Stats(CancellationToken ct)
        => Ok(await _service.GetStatsAsync(ct));

    [HttpGet("holds")]
    public async Task<ActionResult<PagedResponse<AdminHoldRow>>> Holds(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? classId = null,
        CancellationToken ct = default)
    {
        // Clamp inputs explicitly — a caller sending page=-5 or pageSize=1M
        // gets deterministic behaviour rather than silent corruption.
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;
        return Ok(await _service.ListHoldsAsync(page, pageSize, status, classId, ct));
    }
}