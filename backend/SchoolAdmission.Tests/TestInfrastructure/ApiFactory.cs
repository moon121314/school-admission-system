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

    public ApiFactory(PostgresFixture db) => _db = db;

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