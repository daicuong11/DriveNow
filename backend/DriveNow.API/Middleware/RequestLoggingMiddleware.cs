using System.Diagnostics;
using System.Text;
using Serilog;
using Serilog.Events;

namespace DriveNow.API.Middleware;

/// <summary>
/// Middleware để log request và response
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestPath = context.Request.Path;
        var requestMethod = context.Request.Method;
        var requestQuery = context.Request.QueryString.ToString();
        var userId = context.User?.Identity?.Name ?? "Anonymous";
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = context.Request.Headers["User-Agent"].ToString();

        // Log request
        Log.Information(
            "Request: {RequestMethod} {RequestPath}{RequestQuery} | User: {UserId} | IP: {IpAddress} | UserAgent: {UserAgent} | TraceId: {TraceId}",
            requestMethod,
            requestPath,
            requestQuery,
            userId,
            ipAddress,
            userAgent,
            context.TraceIdentifier);

        // Log request body nếu có (chỉ cho POST, PUT, PATCH)
        if (context.Request.ContentLength > 0 &&
            (requestMethod == "POST" || requestMethod == "PUT" || requestMethod == "PATCH"))
        {
            context.Request.EnableBuffering();
            var body = await ReadRequestBodyAsync(context.Request);
            if (!string.IsNullOrEmpty(body) && body.Length < 10000) // Chỉ log nếu body < 10KB
            {
                Log.Debug("Request Body: {RequestBody}", body);
            }
        }

        // Capture response
        var originalBodyStream = context.Response.Body;
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var responseStatusCode = context.Response.StatusCode;
            var responseBodyContent = await ReadResponseBodyAsync(context.Response);

            // Log response
            if (responseStatusCode >= 400)
            {
                Log.Warning(
                    "Response: {RequestMethod} {RequestPath} | Status: {StatusCode} | Duration: {Duration}ms | User: {UserId} | TraceId: {TraceId}",
                    requestMethod,
                    requestPath,
                    responseStatusCode,
                    stopwatch.ElapsedMilliseconds,
                    userId,
                    context.TraceIdentifier);
            }
            else
            {
                Log.Information(
                    "Response: {RequestMethod} {RequestPath} | Status: {StatusCode} | Duration: {Duration}ms | User: {UserId} | TraceId: {TraceId}",
                    requestMethod,
                    requestPath,
                    responseStatusCode,
                    stopwatch.ElapsedMilliseconds,
                    userId,
                    context.TraceIdentifier);
            }

            // Log response body nếu có lỗi
            if (responseStatusCode >= 400 && !string.IsNullOrEmpty(responseBodyContent) && responseBodyContent.Length < 10000)
            {
                Log.Warning("Response Body: {ResponseBody}", responseBodyContent);
            }

            // Copy response body back
            await responseBody.CopyToAsync(originalBodyStream);
            context.Response.Body = originalBodyStream;
        }
    }

    private async Task<string> ReadRequestBodyAsync(HttpRequest request)
    {
        request.Body.Position = 0;
        using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        request.Body.Position = 0;
        return body;
    }

    private async Task<string> ReadResponseBodyAsync(HttpResponse response)
    {
        response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(response.Body, Encoding.UTF8, leaveOpen: true).ReadToEndAsync();
        response.Body.Seek(0, SeekOrigin.Begin);
        return body;
    }
}

