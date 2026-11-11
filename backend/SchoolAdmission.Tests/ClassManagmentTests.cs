using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Tests.TestInfrastructure;
using Xunit;

namespace SchoolAdmission.Tests;

public class ClassManagementTests : TestBase
{
    public ClassManagementTests(PostgresFixture db) : base(db) { }

    [Fact]
    public async Task Update_ChangesNameAndSeats()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var id = await CreateClassAsync(client, "Original", 20);

        var response = await client.PutAsJsonAsync($"/classes/{id}", new
        {
            name = "Renamed",
            totalSeats = 30,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(updated);
        Assert.Equal("Renamed", updated!.Name);
        Assert.Equal(30, updated.TotalSeats);
    }

    [Fact]
    public async Task Update_RejectsSeatsBelowUsage()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var id = await CreateClassAsync(client, "C", 5);

        var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{id}/holds");
        req.Headers.Add("X-Student-Id", StudentId(1));
        await client.SendAsync(req);
        req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{id}/holds");
        req.Headers.Add("X-Student-Id", StudentId(2));
        await client.SendAsync(req);

        var response = await client.PutAsJsonAsync($"/classes/{id}", new
        {
            name = "C",
            totalSeats = 1,
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Update_UnknownClass_Returns404()
    {
        using var api = CreateApi();
        var client = api.CreateClient();

        var response = await client.PutAsJsonAsync("/classes/9999", new
        {
            name = "Ghost",
            totalSeats = 10,
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}