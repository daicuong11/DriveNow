using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DriveNow.Data.DbContext;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "DriveNow API",
        Version = "v1",
        Description = "API cho hệ thống quản lý cho thuê xe hơi tự lái",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "DriveNow Team",
            Email = "support@drivenow.com"
        }
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter your token (without 'Bearer' prefix) in the text input below. Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments if available
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Register Business Services
builder.Services.AddScoped<DriveNow.Business.Interfaces.IAuthService, DriveNow.Business.Services.AuthService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.IVehicleTypeService, DriveNow.Business.Services.VehicleTypeService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.IVehicleBrandService, DriveNow.Business.Services.VehicleBrandService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.IVehicleColorService, DriveNow.Business.Services.VehicleColorService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.ICustomerService, DriveNow.Business.Services.CustomerService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.IEmployeeService, DriveNow.Business.Services.EmployeeService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.ISystemConfigService, DriveNow.Business.Services.SystemConfigService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.IDashboardService, DriveNow.Business.Services.DashboardService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.IVehicleService, DriveNow.Business.Services.VehicleService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.IVehicleInOutService, DriveNow.Business.Services.VehicleInOutService>();
builder.Services.AddScoped<DriveNow.Business.Interfaces.IVehicleMaintenanceService, DriveNow.Business.Services.VehicleMaintenanceService>();

// SignalR
builder.Services.AddSignalR();

// Register Repositories
builder.Services.AddScoped(typeof(DriveNow.Data.Interfaces.IRepository<>), typeof(DriveNow.Data.Repositories.Repository<>));

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication & Authorization
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey ?? throw new InvalidOperationException("JWT SecretKey is not configured"))),
        ClockSkew = TimeSpan.Zero // Remove clock skew tolerance for development
    };

    // Add event handlers for debugging and token extraction
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(context.Exception, "JWT Authentication failed");
            return System.Threading.Tasks.Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("JWT Token validated successfully for user: {User}", context.Principal?.Identity?.Name);
            return System.Threading.Tasks.Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("JWT Challenge triggered. Error: {Error}, ErrorDescription: {ErrorDescription}",
                context.Error, context.ErrorDescription);
            return System.Threading.Tasks.Task.CompletedTask;
        },
        OnMessageReceived = context =>
        {
            // Allow token from query string (for SignalR, etc.)
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/api"))
            {
                context.Token = accessToken;
            }
            return System.Threading.Tasks.Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://localhost:7291",
                "http://localhost:5151"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(_ => true) // Allow any origin in development
              .AllowCredentials()
              .WithExposedHeaders("*");
    });
});

// Logging - Configure Serilog với nhiều enrichers
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "DriveNow.API")
    .CreateLogger();

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "DriveNow.API")
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss.fff} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/drivenow-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}{NewLine}",
        shared: true)
    .WriteTo.File(
        path: "logs/drivenow-errors-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 90,
        restrictedToMinimumLevel: Serilog.Events.LogEventLevel.Error,
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}{NewLine}",
        shared: true)
);

var app = builder.Build();

// Seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        await DriveNow.Data.Seed.DataSeeder.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DriveNow API V1");
        c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
        c.DisplayRequestDuration();
        c.EnableDeepLinking();
        c.EnableFilter();
        c.ShowExtensions();
        c.EnableValidator();
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
    });
}

app.UseCors("AllowReactApp");

// HTTPS Redirection - only if HTTPS is configured
// For HTTP-only profile, this will be skipped automatically
app.UseHttpsRedirection();

// Static files for uploaded images - MUST be before authentication/authorization
// Configure static files to serve from wwwroot with CORS and proper content types
var staticFileOptions = new Microsoft.AspNetCore.Builder.StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Add CORS headers for static files
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000");
    },
    // Ensure files are served with correct content type
    ContentTypeProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider
    {
        Mappings =
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".gif"] = "image/gif"
        }
    },
    // Request path must match the file path
    RequestPath = ""
};
app.UseStaticFiles(staticFileOptions);

// Request logging middleware (should be before exception handling)
app.UseMiddleware<DriveNow.API.Middleware.RequestLoggingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// Exception handling middleware (should be after authentication/authorization)
app.UseMiddleware<DriveNow.API.Middleware.ExceptionHandlingMiddleware>();

// SignalR
app.MapHub<DriveNow.API.Hubs.VehicleHub>("/hubs/vehicle");

// Map controllers - ImagesController has [AllowAnonymous] so it should work
app.MapControllers();

app.Run();
