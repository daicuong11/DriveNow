using System.Net;
using System.Text.Json;
using Serilog;

namespace DriveNow.API.Middleware;

/// <summary>
/// Middleware để xử lý và log exceptions
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = new
        {
            success = false,
            message = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu",
            error = exception.Message,
            traceId = context.TraceIdentifier
        };

        // Log exception với đầy đủ thông tin
        var requestPath = context.Request.Path;
        var requestMethod = context.Request.Method;
        var requestQuery = context.Request.QueryString.ToString();
        var userId = context.User?.Identity?.Name ?? "Anonymous";
        var userAgent = context.Request.Headers["User-Agent"].ToString();
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        // Log với Serilog để có structured logging
        Log.Error(exception,
            "Exception occurred: {ExceptionType} | Path: {RequestPath} | Method: {RequestMethod} | Query: {RequestQuery} | User: {UserId} | IP: {IpAddress} | UserAgent: {UserAgent} | TraceId: {TraceId}",
            exception.GetType().Name,
            requestPath,
            requestMethod,
            requestQuery,
            userId,
            ipAddress,
            userAgent,
            context.TraceIdentifier);

        // Log inner exception nếu có
        if (exception.InnerException != null)
        {
            Log.Error(exception.InnerException,
                "Inner Exception: {InnerExceptionType} | Message: {InnerExceptionMessage}",
                exception.InnerException.GetType().Name,
                exception.InnerException.Message);
        }

        // Log stack trace
        Log.Debug("Stack Trace: {StackTrace}", exception.StackTrace);

        // Set status code dựa trên exception type
        switch (exception)
        {
            case KeyNotFoundException:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                break;
            case UnauthorizedAccessException:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                break;
            case ArgumentException:
            case InvalidOperationException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                break;
            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                break;
        }

        var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await response.WriteAsync(jsonResponse);
    }
}

