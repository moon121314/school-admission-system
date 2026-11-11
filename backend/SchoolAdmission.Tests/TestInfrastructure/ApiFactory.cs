using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SchoolAdmission.Infrastructure.Persistence;
using SchoolAdmission.Infrastructure.Services;

namespace SchoolAdmission.Tests.TestInfrastructure;

public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly PostgresFixture _db;
    public int HoldDurationSeconds { get; set; } = 600;

    public ApiFactory(PostgresFixture db)
    {
        // Turn off the rate limiter for tests. Without this, a concurrency test
        // that fires 20 concurrent requests from the same process hits the
        // 10-writes/minute IP limiter after the 10th request and the remaining
        // 10 are rejected with 429 before ever reaching the service layer.
        // Program.cs reads this env var when configuring rate limiting.
        Environment.SetEnvironmentVariable("DISABLE_RATE_LIMIT", "true");
        _db = db;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AdmissionDbContext>>();
            services.AddDbContext<AdmissionDbContext>(o => o.UseNpgsql(_db.ConnectionString));

            services.RemoveAll<HoldOptions>();
            services.AddSingleton(new HoldOptions { HoldDurationSeconds = HoldDurationSeconds });
        });
    }
}