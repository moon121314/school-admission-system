using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SchoolAdmission.Api.Extensions;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
public class HoldsController : ControllerBase
{
    private readonly IHoldService _service;
    public HoldsController(IHoldService service) => _service = service;

    [HttpPost("classes/{classId:int}/holds")]
    [EnableRateLimiting("write")]
    public async Task<ActionResult<HoldCreatedResponse>> Create(int classId, CancellationToken ct)
    {
        string studentId = HttpContext.RequireStudentId();
        var response = await _service.CreateAsync(classId, studentId, ct);
        return CreatedAtAction(nameof(Get), new { holdId = response.HoldId }, response);
    }

    [HttpGet("holds/{holdId:int}")]
    public async Task<ActionResult<HoldDetailResponse>> Get(int holdId, CancellationToken ct)
        => Ok(await _service.GetAsync(holdId, ct));

    [HttpPost("holds/{holdId:int}/confirm")]
    [EnableRateLimiting("write")]
    public async Task<ActionResult<ConfirmResponse>> Confirm(int holdId, CancellationToken ct)
    {
        string studentId = HttpContext.RequireStudentId();
        return Ok(await _service.ConfirmAsync(holdId, studentId, ct));
    }

    [HttpDelete("holds/{holdId:int}")]
    [EnableRateLimiting("write")]
    public async Task<IActionResult> Cancel(int holdId, CancellationToken ct)
    {
        string studentId = HttpContext.RequireStudentId();
        await _service.CancelAsync(holdId, studentId, ct);
        return NoContent();
    }
}