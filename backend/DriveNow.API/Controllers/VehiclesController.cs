using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Vehicle;
using DriveNow.Business.DTOs.MasterData;
using DriveNow.Business.Interfaces;
using DriveNow.API.Hubs;
using DriveNow.Common.Helpers;
using System;

namespace DriveNow.API.Controllers;

/// <summary>
/// Vehicles Controller - Quản lý xe
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _service;
    private readonly IHubContext<VehicleHub> _hubContext;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(IVehicleService service, IHubContext<VehicleHub> hubContext, ILogger<VehiclesController> logger)
    {
        _service = service;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách xe (có phân trang, tìm kiếm, lọc) - Tất cả user đã đăng nhập
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] PagedRequest request)
    {
        var result = await _service.GetPagedAsync(request);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Lấy chi tiết xe theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy xe" });
        }
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Lấy danh sách xe có sẵn (Available)
    /// </summary>
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable()
    {
        var result = await _service.GetAvailableAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Lấy lịch sử xe
    /// </summary>
    [HttpGet("{id}/history")]
    public async Task<IActionResult> GetHistory(int id)
    {
        var result = await _service.GetHistoryAsync(id);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Tạo mới xe (Chỉ Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateVehicleRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            // Notify via SignalR
            await _hubContext.Clients.All.SendAsync("VehicleCreated", result);
            return Ok(new { success = true, data = result, message = "Tạo mới thành công" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật xe (Chỉ Admin)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVehicleRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request);
            // Notify via SignalR
            await _hubContext.Clients.Group($"vehicle_{id}").SendAsync("VehicleUpdated", result);
            await _hubContext.Clients.All.SendAsync("VehicleListUpdated");
            return Ok(new { success = true, data = result, message = "Cập nhật thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa xe (Chỉ Admin)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        // Notify via SignalR
        await _hubContext.Clients.Group($"vehicle_{id}").SendAsync("VehicleDeleted", id);
        await _hubContext.Clients.All.SendAsync("VehicleListUpdated");
        return Ok(new { success = true, message = "Xóa thành công" });
    }

    /// <summary>
    /// Tạo bản sao xe (Chỉ Admin)
    /// </summary>
    [HttpPost("{id}/copy")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Copy(int id)
    {
        try
        {
            var result = await _service.CopyAsync(id);
            return Ok(new { success = true, data = result, message = "Tạo bản sao thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Import Excel (Chỉ Admin)
    /// </summary>
    [HttpPost("import")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ImportExcel(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "File không được rỗng" });
        }

        var allowedExtensions = new[] { ".xlsx", ".xls" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return BadRequest(new { success = false, message = "Chỉ chấp nhận file Excel (.xlsx, .xls)" });
        }

        try
        {
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            var result = await _service.ImportExcelAsync(memoryStream, file.FileName);

            if (result.Success)
            {
                return Ok(new { success = true, data = result, message = result.Message });
            }
            else
            {
                return BadRequest(new
                {
                    success = false,
                    message = result.Message,
                    errors = result.Errors,
                    totalRows = result.TotalRows
                });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Lỗi khi import: {ex.Message}" });
        }
    }

    /// <summary>
    /// Export Excel - Tất cả user đã đăng nhập
    /// </summary>
    [HttpPost("export")]
    public async Task<IActionResult> ExportExcel([FromBody] ExportExcelRequest? request)
    {
        try
        {
            var memoryStream = await _service.ExportExcelAsync(request?.Ids);
            var fileName = "Vehicle_Export.xlsx";

            Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{fileName}\"; filename*=UTF-8''{Uri.EscapeDataString(fileName)}");

            return File(memoryStream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Lỗi khi export: {ex.Message}" });
        }
    }

    /// <summary>
    /// Xóa nhiều xe (Chỉ Admin)
    /// </summary>
    [HttpPost("bulk-delete")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteMultiple([FromBody] List<int> ids)
    {
        try
        {
            await _service.DeleteMultipleAsync(ids);
            return Ok(new { success = true, message = $"Đã xóa {ids.Count} xe thành công" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Upload hình ảnh xe
    /// </summary>
    [HttpPost("upload-image")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "File không được để trống" });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return BadRequest(new { success = false, message = "Chỉ chấp nhận file ảnh (.jpg, .jpeg, .png)" });
        }

        var maxSize = 5 * 1024 * 1024; // 5MB
        if (file.Length > maxSize)
        {
            return BadRequest(new { success = false, message = "File không được vượt quá 5MB" });
        }

        try
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "vehicles");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/vehicles/{fileName}";
            return Ok(new { success = true, url = imageUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Lỗi khi upload: {ex.Message}" });
        }
    }

    /// <summary>
    /// Export PDF cho một xe cụ thể
    /// </summary>
    [HttpGet("{id}/export-pdf")]
    public async Task<IActionResult> ExportPdf(int id)
    {
        try
        {
            var vehicle = await _service.GetByIdAsync(id);
            if (vehicle == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy xe" });
            }

            var pdfBytes = PdfExportHelper.ExportVehicleToPdf(vehicle, $"Thông tin Xe - {vehicle.Code}");
            var fileName = $"Vehicle_{vehicle.Code}_{DateTime.Now:yyyyMMddHHmmss}.pdf";

            Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{fileName}\"; filename*=UTF-8''{Uri.EscapeDataString(fileName)}");

            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Lỗi khi export PDF: {ex.Message}" });
        }
    }
}

