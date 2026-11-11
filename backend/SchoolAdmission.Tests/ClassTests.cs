using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Tests.TestInfrastructure;
using Xunit;

namespace SchoolAdmission.Tests;

public class ClassTests : TestBase
{
    public ClassTests(PostgresFixture db) : base(db) { }

    [Fact]
    public async Task CreateClass_Returns201WithId()
    {
        using var api = CreateApi();
        var client = api.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/classes", new { name = "Class 6 - Morning Shift", totalSeats = 120 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(body);
        Assert.True(body!.Id > 0);
        Assert.Equal("Class 6 - Morning Shift", body.Name);
        Assert.Equal(120, body.TotalSeats);
        Assert.Equal(120, body.AvailableSeats);
    }

    [Fact]
    public async Task CreateClass_ZeroSeats_Returns400()
    {
        using var api = CreateApi();
        var client = api.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/classes", new { name = "Bad", totalSeats = 0 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetClass_UnknownId_Returns404()
    {
        using var api = CreateApi();
        var client = api.CreateClient();

        var response = await client.GetAsync("/classes/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ListClasses_ReturnsAll()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        await CreateClassAsync(client, "A", 10);
        await CreateClassAsync(client, "B", 20);

        var list = await client.GetFromJsonAsync<ClassResponse[]>("/classes");
        Assert.NotNull(list);
        Assert.True(list!.Length >= 2);
    }
}