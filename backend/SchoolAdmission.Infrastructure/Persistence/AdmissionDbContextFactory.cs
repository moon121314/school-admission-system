using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SchoolAdmission.Infrastructure.Persistence;

public class AdmissionDbContextFactory : IDesignTimeDbContextFactory<AdmissionDbContext>
{
    public AdmissionDbContext CreateDbContext(string[] args)
    {
        string host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
        string port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
        string database = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "school_admission";
        string user = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
        string password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "postgres";
        string cs = $"Host={host};Port={port};Database={database};Username={user};Password={password}";

        var options = new DbContextOptionsBuilder<AdmissionDbContext>()
            .UseNpgsql(cs).Options;
        return new AdmissionDbContext(options);
    }
}