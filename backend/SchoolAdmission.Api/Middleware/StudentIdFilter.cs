using Microsoft.AspNetCore.Mvc.Filters;
using SchoolAdmission.Domain.Exceptions;

namespace SchoolAdmission.Api.Middleware;

public class StudentIdFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.HttpContext.Request.Headers.TryGetValue("X-Student-Id", out var values))
        {
            string? studentId = values.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(studentId) || studentId.Length != 17 || !studentId.All(char.IsDigit))
                throw new ValidationException("X-Student-Id header must be exactly 17 digits.");
            context.HttpContext.Items["StudentId"] = studentId;
        }
    }
    public void OnActionExecuted(ActionExecutedContext context) { }
}