using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace DriveNow.API.Controllers;

/// <summary>
/// Images Controller - Serve uploaded images (public, no authentication required)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class ImagesController : ControllerBase
{
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(ILogger<ImagesController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Lấy hình ảnh xe
    /// </summary>
    [HttpGet("vehicles/{fileName}")]
    [ResponseCache(Duration = 31536000, Location = ResponseCacheLocation.Any)] // Cache 1 year
    public async Task<IActionResult> GetVehicleImage(string fileName)
    {
        try
        {
            // Log incoming request
            _logger.LogInformation("GetVehicleImage called with fileName: {FileName}, User: {User}, IsAuthenticated: {IsAuth}, Path: {Path}", 
                fileName, User?.Identity?.Name ?? "Anonymous", User?.Identity?.IsAuthenticated ?? false, Request.Path);

            // Sanitize fileName to prevent path traversal
            var sanitizedFileName = Path.GetFileName(fileName);
            if (string.IsNullOrEmpty(sanitizedFileName))
            {
                _logger.LogWarning("Invalid fileName provided: {FileName}", fileName);
                return BadRequest(new { success = false, message = "Tên file không hợp lệ" });
            }

            var imagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "vehicles", sanitizedFileName);

            _logger.LogInformation("Loading vehicle image: {FileName}, Path: {Path}, Exists: {Exists}", 
                sanitizedFileName, imagePath, System.IO.File.Exists(imagePath));

            if (!System.IO.File.Exists(imagePath))
            {
                _logger.LogWarning("Vehicle image not found: {Path}", imagePath);
                return NotFound(new { success = false, message = $"Không tìm thấy hình ảnh: {sanitizedFileName}" });
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(imagePath);
            var contentType = GetContentType(sanitizedFileName);

            _logger.LogInformation("Successfully loaded vehicle image: {FileName}, Size: {Size} bytes, ContentType: {ContentType}", 
                sanitizedFileName, fileBytes.Length, contentType);

            // Set response headers explicitly
            Response.ContentType = contentType;
            Response.Headers.Append("Cache-Control", "public, max-age=31536000");
            Response.Headers.Append("Access-Control-Allow-Origin", "*");
            
            return File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading vehicle image: {FileName}, Exception: {Exception}", fileName, ex.ToString());
            return StatusCode(500, new { success = false, message = $"Lỗi khi đọc hình ảnh: {ex.Message}" });
        }
    }

    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }
}

