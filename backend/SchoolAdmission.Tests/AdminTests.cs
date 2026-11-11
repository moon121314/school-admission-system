using System.Net.Http.Json;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Tests.TestInfrastructure;
using Xunit;

namespace SchoolAdmission.Tests;

public class AdminTests : TestBase
{
    public AdminTests(PostgresFixture db) : base(db) { }

    // ─── Stats ────────────────────────────────────────────────────────────
    // The PostgresFixture is shared across all tests in this class, so the
    // database is never guaranteed to be empty. All stats assertions use
    // deltas (before vs after) rather than absolute counts.

    [Fact]
    public async Task Stats_InvariantAlwaysHolds()
    {
        using var api = CreateApi();
        var client = api.CreateClient();

        await CreateClassAsync(client, "AdminInvariant-A", 10);
        await CreateClassAsync(client, "AdminInvariant-B", 20);

        var stats = await client.GetFromJsonAsync<AdminStatsResponse>("/admin/stats");
        Assert.NotNull(stats);
        // Structural invariants that must hold regardless of prior state.
        Assert.True(stats!.TotalClasses >= 2);
        Assert.True(stats.TotalSeats >= 30);
        Assert.Equal(
            stats.TotalSeats,
            stats.HeldSeats + stats.ConfirmedSeats + stats.AvailableSeats);
        Assert.True(stats.AvailableSeats >= 0);
    }

    [Fact]
    public async Task Stats_AddingClasses_IncreasesAggregatesByExactDelta()
    {
        using var api = CreateApi();
        var client = api.CreateClient();

        var before = await client.GetFromJsonAsync<AdminStatsResponse>("/admin/stats");
        Assert.NotNull(before);

        await CreateClassAsync(client, "AdminDelta-A", 10);
        await CreateClassAsync(client, "AdminDelta-B", 20);

        var after = await client.GetFromJsonAsync<AdminStatsResponse>("/admin/stats");
        Assert.NotNull(after);

        Assert.Equal(before!.TotalClasses + 2, after!.TotalClasses);
        Assert.Equal(before.TotalSeats + 30, after.TotalSeats);
        Assert.Equal(before.AvailableSeats + 30, after.AvailableSeats);
    }

    // ─── Holds list ───────────────────────────────────────────────────────
    // Filter by the classId the test just created so results are isolated
    // from holds created by other tests in this class.

    [Fact]
    public async Task Holds_Paginated_IsolatedByClass_ReturnsCorrectMetadata()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "PagingClass", 50);

        for (int i = 0; i < 5; i++)
        {
            var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            req.Headers.Add("X-Student-Id", StudentId(i));
            await client.SendAsync(req);
        }

        var page1 = await client.GetFromJsonAsync<PagedResponse<AdminHoldRow>>(
            $"/admin/holds?page=1&pageSize=2&classId={classId}");

        Assert.NotNull(page1);
        Assert.Equal(5, page1!.Total);
        Assert.Equal(3, page1.TotalPages);
        Assert.Equal(2, page1.Items.Count);
        Assert.Equal(1, page1.Page);
        Assert.All(page1.Items, r => Assert.Equal(classId, r.ClassId));
    }

    [Fact]
    public async Task Holds_FilterByStatus_IsolatedByClass_ReturnsOnlyMatching()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "StatusFilterClass", 10);

        var create = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        create.Headers.Add("X-Student-Id", StudentId(1));
        var response = await client.SendAsync(create);
        var hold = await response.Content.ReadFromJsonAsync<HoldCreatedResponse>();

        var confirm = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold!.HoldId}/confirm");
        confirm.Headers.Add("X-Student-Id", StudentId(1));
        await client.SendAsync(confirm);

        var confirmedOnly = await client.GetFromJsonAsync<PagedResponse<AdminHoldRow>>(
            $"/admin/holds?status=CONFIRMED&classId={classId}");

        Assert.NotNull(confirmedOnly);
        Assert.Single(confirmedOnly!.Items);
        Assert.Equal("CONFIRMED", confirmedOnly.Items[0].Status);
        Assert.Equal(classId, confirmedOnly.Items[0].ClassId);
    }
}