using System.Net;
using System.Text.Json;
using SchoolAdmission.Domain.Exceptions;

namespace SchoolAdmission.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    { _next = next; _logger = logger; }

    public async Task InvokeAsync(HttpContext context)
    {
        try { await _next(context); }
        catch (Exception ex)
        {
            var (status, message) = ex switch
            {
                NotFoundException   => (HttpStatusCode.NotFound, ex.Message),
                ValidationException => (HttpStatusCode.BadRequest, ex.Message),
                ConflictException   => (HttpStatusCode.Conflict, ex.Message),
                ForbiddenException  => (HttpStatusCode.Forbidden, ex.Message),
                DomainException     => (HttpStatusCode.BadRequest, ex.Message),
                _                   => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
            };
            if (status == HttpStatusCode.InternalServerError)
                _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = (int)status;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { error = message }));
        }
    }
}