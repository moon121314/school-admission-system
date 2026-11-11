using Microsoft.AspNetCore.Mvc.Filters;
using SchoolAdmission.Domain.Exceptions;

namespace SchoolAdmission.Api.Middleware;

public class StudentIdFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.HttpContext.Request.Headers.TryGetValue("X-Student-Id", out var values))
        {
            // Trim once — copy-paste from curl / formatted sources can add
            // leading or trailing spaces which are not part of the identifier.
            string? studentId = values.FirstOrDefault()?.Trim();

            // Enforce exactly 17 ASCII digits.
            // NOTE: char.IsDigit() would return true for Unicode digits
            // (e.g. Arabic-Indic '٢', Devanagari '५'). We need ASCII only
            // so the value stored in the database matches what the frontend
            // sends and what any downstream raw SQL comparison expects.
            if (string.IsNullOrEmpty(studentId)
                || studentId.Length != 17
                || !studentId.All(c => c is >= '0' and <= '9'))
            {
                throw new ValidationException(
                    "X-Student-Id header must be exactly 17 ASCII digits.");
            }

            context.HttpContext.Items["StudentId"] = studentId;
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}