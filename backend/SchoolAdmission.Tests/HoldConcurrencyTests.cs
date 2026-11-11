using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Tests.TestInfrastructure;
using Xunit;

namespace SchoolAdmission.Tests;

public class HoldConcurrencyTests : TestBase
{
    public HoldConcurrencyTests(PostgresFixture db) : base(db) { }

    [Fact]
    public async Task ConcurrentHolds_NeverExceedCapacity()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "Tiny", totalSeats: 5);

        const int concurrent = 20;
        var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        var tasks = Enumerable.Range(0, concurrent).Select(async i =>
        {
            await gate.Task;
            var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            req.Headers.Add("X-Student-Id", StudentId(i));
            return await client.SendAsync(req);
        }).ToList();

        gate.SetResult();
        var responses = await Task.WhenAll(tasks);

        var successes = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflicts = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        Assert.Equal(5, successes);
        Assert.Equal(concurrent - 5, conflicts);

        var finalClass = await client.GetFromJsonAsync<ClassResponse>($"/classes/{classId}");
        Assert.NotNull(finalClass);
        Assert.True(finalClass!.HeldSeats + finalClass.ConfirmedSeats <= 5);
        Assert.Equal(0, finalClass.AvailableSeats);
    }

    [Fact]
    public async Task ConcurrentHolds_SameStudent_OnlyOneWins()
    {
        using var api = CreateApi();
        var client = api.CreateClient();
        var classId = await CreateClassAsync(client, "Big", totalSeats: 100);
        var studentId = StudentId(999);

        const int concurrent = 10;
        var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        var tasks = Enumerable.Range(0, concurrent).Select(async _ =>
        {
            await gate.Task;
            var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            req.Headers.Add("X-Student-Id", studentId);
            return await client.SendAsync(req);
        }).ToList();

        gate.SetResult();
        var responses = await Task.WhenAll(tasks);

        var successes = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        Assert.Equal(1, successes);
    }
}