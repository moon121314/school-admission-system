using System.Net;
using SchoolAdmission.Tests.TestInfrastructure;
using Xunit;

namespace SchoolAdmission.Tests;

public class ValidationTests : TestBase
{
    public ValidationTests(PostgresFixture db) : base(db) { }

    [Fact]
    public async Task MissingHeader_Returns400()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 5);

        var response = await client.PostAsync($"/classes/{classId}/holds", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("SHORT")]
    [InlineData("201526912345678901234")]
    [InlineData("ABCDEFGHIJKLMNOPQ")]
    public async Task InvalidHeader_Returns400(string bad)
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 5);

        var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        req.Headers.Add("X-Student-Id", bad);
        var response = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UnknownHold_Returns404()
    {
        using var api = CreateApi();
        var client = api.CreateClient();

        var req = new HttpRequestMessage(HttpMethod.Get, "/holds/99999");
        req.Headers.Add("X-Student-Id", StudentId(1));
        var response = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}