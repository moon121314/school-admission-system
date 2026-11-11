using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Tests.TestInfrastructure;
using Xunit;

namespace SchoolAdmission.Tests;

public class HoldLifecycleTests : TestBase
{
    public HoldLifecycleTests(PostgresFixture db) : base(db) { }

    [Fact]
    public async Task Hold_ConfirmThenReconfirm_IsIdempotent()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 10);
        var studentId = StudentId(1);

        var create = await client.SendAsync(Post($"/classes/{classId}/holds", studentId));
        var hold = await create.Content.ReadFromJsonAsync<HoldCreatedResponse>();
        Assert.NotNull(hold);

        var first = await client.SendAsync(Post($"/holds/{hold!.HoldId}/confirm", studentId));
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.SendAsync(Post($"/holds/{hold.HoldId}/confirm", studentId));
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);

        var cls = await client.GetFromJsonAsync<ClassResponse>($"/classes/{classId}");
        Assert.Equal(1, cls!.ConfirmedSeats);
    }

    [Fact]
    public async Task Hold_Cancel_ReleasesSeat()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 1);
        var studentId = StudentId(1);

        var create = await client.SendAsync(Post($"/classes/{classId}/holds", studentId));
        var hold = await create.Content.ReadFromJsonAsync<HoldCreatedResponse>();

        var cancel = await client.SendAsync(Delete($"/holds/{hold!.HoldId}", studentId));
        Assert.Equal(HttpStatusCode.NoContent, cancel.StatusCode);

        var cls = await client.GetFromJsonAsync<ClassResponse>($"/classes/{classId}");
        Assert.Equal(1, cls!.AvailableSeats);
    }

    [Fact]
    public async Task Hold_Expired_CannotConfirm()
    {
        using var api = CreateApi();
        api.HoldDurationSeconds = 1;
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 5);
        var studentId = StudentId(1);

        var create = await client.SendAsync(Post($"/classes/{classId}/holds", studentId));
        var hold = await create.Content.ReadFromJsonAsync<HoldCreatedResponse>();

        await Task.Delay(TimeSpan.FromSeconds(1.5));

        var confirm = await client.SendAsync(Post($"/holds/{hold!.HoldId}/confirm", studentId));
        Assert.Equal(HttpStatusCode.Conflict, confirm.StatusCode);
    }

    [Fact]
    public async Task Hold_DuplicateActive_Returns409()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 5);
        var studentId = StudentId(1);

        var first = await client.SendAsync(Post($"/classes/{classId}/holds", studentId));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.SendAsync(Post($"/classes/{classId}/holds", studentId));
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Hold_CapacityExhausted_Returns409()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 1);

        var first = await client.SendAsync(Post($"/classes/{classId}/holds", StudentId(1)));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.SendAsync(Post($"/classes/{classId}/holds", StudentId(2)));
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Hold_OwnerCheck_Returns403()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 5);

        var create = await client.SendAsync(Post($"/classes/{classId}/holds", StudentId(1)));
        var hold = await create.Content.ReadFromJsonAsync<HoldCreatedResponse>();

        var other = await client.SendAsync(Post($"/holds/{hold!.HoldId}/confirm", StudentId(2)));
        Assert.Equal(HttpStatusCode.Forbidden, other.StatusCode);
    }

    [Fact]
    public async Task Hold_ListMine_ShowsOnlyOwnHolds()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "C", 5);

        await client.SendAsync(Post($"/classes/{classId}/holds", StudentId(1)));
        await client.SendAsync(Post($"/classes/{classId}/holds", StudentId(2)));

        var req = new HttpRequestMessage(HttpMethod.Get, "/me/holds");
        req.Headers.Add("X-Student-Id", StudentId(1));
        var response = await client.SendAsync(req);
        var holds = await response.Content.ReadFromJsonAsync<MyHoldResponse[]>();

        Assert.Single(holds!);
        Assert.Equal("HELD", holds![0].Status.ToString());
    }

    private static HttpRequestMessage Post(string url, string studentId)
    {
        var r = new HttpRequestMessage(HttpMethod.Post, url);
        r.Headers.Add("X-Student-Id", studentId);
        return r;
    }

    private static HttpRequestMessage Delete(string url, string studentId)
    {
        var r = new HttpRequestMessage(HttpMethod.Delete, url);
        r.Headers.Add("X-Student-Id", studentId);
        return r;
    }
}