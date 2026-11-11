using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Middleware;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Infrastructure.Persistence;
using SchoolAdmission.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

string host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
string port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
string database = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "school_admission";
string user = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
string password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "postgres";
string connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={password}";

builder.Services.AddDbContext<AdmissionDbContext>(o => o.UseNpgsql(connectionString));

var holdSeconds = int.TryParse(Environment.GetEnvironmentVariable("HOLD_DURATION_SECONDS"), out var s) ? s : 600;
builder.Services.AddSingleton(new HoldOptions { HoldDurationSeconds = holdSeconds });
builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddScoped<IClassService, ClassService>();
builder.Services.AddScoped<IHoldService, HoldService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<StudentIdFilter>();
builder.Services.AddScoped<AdminKeyFilter>();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers(o => o.Filters.Add<StudentIdFilter>())
    .AddJsonOptions(opts =>
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddOpenApi();

// Rate limiting:
//   - "write" policy: 10 writes / minute per IP (holds create, confirm, cancel, class create, class edit)
//   - default policy: 120 requests / minute per IP (reads + everything else)
//   - DISABLE_RATE_LIMIT=true short-circuits both limiters to NoLimiter — used by
//     integration tests where 20+ concurrent writes come from the same process
//     and would otherwise be blocked before reaching the service layer.
var disableRateLimit = string.Equals(
    Environment.GetEnvironmentVariable("DISABLE_RATE_LIMIT"),
    "true", StringComparison.OrdinalIgnoreCase);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"error\":\"Too many requests. Please slow down.\"}", token);
    };

    if (disableRateLimit)
    {
        // Tests: unlimited for both global and named policies so concurrency
        // tests exercise the DB/service layer instead of the limiter.
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
            _ => RateLimitPartition.GetNoLimiter("test"));
        options.AddPolicy("write", _ => RateLimitPartition.GetNoLimiter("test"));
        return;
    }

    options.AddPolicy("write", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
    db.Database.Migrate();
    await DemoData.SeedAsync(db);
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.UseRateLimiter();

app.MapOpenApi();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();

public partial class Program { }