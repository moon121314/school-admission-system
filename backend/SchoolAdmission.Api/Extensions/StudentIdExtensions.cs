using SchoolAdmission.Domain.Exceptions;

namespace SchoolAdmission.Api.Extensions;

public static class StudentIdExtensions
{
    public static string RequireStudentId(this HttpContext http)
    {
        if (http.Items.TryGetValue("StudentId", out var value) && value is string s) return s;
        throw new ValidationException("X-Student-Id header is required for this endpoint.");
    }
}