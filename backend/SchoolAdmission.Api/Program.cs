using System.Text.Json.Serialization;
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

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers(o => o.Filters.Add<StudentIdFilter>())
    .AddJsonOptions(opts =>
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
    db.Database.Migrate();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();

app.MapOpenApi();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();

public partial class Program { }