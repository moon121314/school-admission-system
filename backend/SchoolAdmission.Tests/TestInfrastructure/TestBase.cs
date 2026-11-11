using System.Net.Http.Json;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Tests.TestInfrastructure;
using Xunit;

namespace SchoolAdmission.Tests;

public abstract class TestBase : IClassFixture<PostgresFixture>
{
    protected readonly PostgresFixture Db;
    protected TestBase(PostgresFixture db) => Db = db;

    protected ApiFactory CreateApi() => new(Db);

    protected static async Task<int> CreateClassAsync(
        HttpClient client, string name, int totalSeats)
    {
        var response = await client.PostAsJsonAsync("/classes", new { name, totalSeats });
        response.EnsureSuccessStatusCode();
        var dto = await response.Content.ReadFromJsonAsync<ClassResponse>();
        return dto!.Id;
    }

    protected static string StudentId(int i) => i.ToString("D17");
}