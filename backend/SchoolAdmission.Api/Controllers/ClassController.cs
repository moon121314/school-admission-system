using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SchoolAdmission.Api.Middleware;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private readonly IClassService _service;
    public ClassesController(IClassService service) => _service = service;

    [HttpPost]
    [EnableRateLimiting("write")]
    [TypeFilter(typeof(AdminKeyFilter))]
    [ProducesResponseType(typeof(ClassResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<ClassResponse>> Create(
        [FromBody] ClassCreateRequest request, CancellationToken ct)
    {
        var response = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { classId = response.Id }, response);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClassResponse>>> List(CancellationToken ct)
        => Ok(await _service.ListAsync(ct));

    [HttpGet("{classId:int}")]
    public async Task<ActionResult<ClassResponse>> Get(int classId, CancellationToken ct)
        => Ok(await _service.GetAsync(classId, ct));

    [HttpPut("{classId:int}")]
    [EnableRateLimiting("write")]
    [TypeFilter(typeof(AdminKeyFilter))]
    public async Task<ActionResult<ClassResponse>> Update(
        int classId, [FromBody] ClassUpdateRequest request, CancellationToken ct)
        => Ok(await _service.UpdateAsync(classId, request, ct));
}