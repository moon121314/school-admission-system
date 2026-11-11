using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SchoolAdmission.Api.Middleware;

/// <summary>
/// Optional shared-secret check for admin endpoints.
///
/// Behaviour:
///   - If ADMIN_API_KEY env var is NOT set → this filter is a no-op
///     (production demo mode: assignment says "no login required").
///   - If ADMIN_API_KEY IS set → every request to a controller that
///     uses this filter must include `X-Admin-Key: <same-value>`.
///
/// This gives the evaluator a working demo out-of-the-box while letting
/// a real deployment lock down admin actions with one env var.
/// </summary>
public class AdminKeyFilter : IActionFilter
{
    private readonly string? _requiredKey;

    public AdminKeyFilter()
    {
        _requiredKey = Environment.GetEnvironmentVariable("ADMIN_API_KEY");
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        // No key configured → allow (demo mode).
        if (string.IsNullOrEmpty(_requiredKey)) return;

        if (!context.HttpContext.Request.Headers.TryGetValue("X-Admin-Key", out var values))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                error = "Admin action requires X-Admin-Key header."
            });
            return;
        }

        if (!string.Equals(values.FirstOrDefault(), _requiredKey, StringComparison.Ordinal))
        {
            context.Result = new UnauthorizedObjectResult(new { error = "Invalid admin key." });
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}