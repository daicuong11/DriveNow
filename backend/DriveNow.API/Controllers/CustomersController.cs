using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;
using DriveNow.Business.Interfaces;
using System;

namespace DriveNow.API.Controllers;

/// <summary>
/// Customers Controller - Quản lý khách hàng
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _service;

    public CustomersController(ICustomerService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] PagedRequest request)
    {
        var result = await _service.GetPagedAsync(request);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy khách hàng" });
        }
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Tạo mới khách hàng (Chỉ Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            return Ok(new { success = true, data = result, message = "Tạo mới thành công" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật khách hàng (Chỉ Admin)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request);
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
    /// Xóa khách hàng (Chỉ Admin)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return Ok(new { success = true, message = "Xóa thành công" });
    }

    /// <summary>
    /// Tạo bản sao khách hàng (Chỉ Admin)
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
    /// Import Excel - Tạo mới khách hàng từ file Excel (Chỉ Admin)
    /// </summary>
    [HttpPost("import")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportExcel([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "File không được để trống" });
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
                return BadRequest(new { success = false, errors = result.Errors, message = result.Message, totalRows = result.TotalRows });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Lỗi khi import: {ex.Message}" });
        }
    }

    /// <summary>
    /// Export Excel - Xuất danh sách khách hàng ra file Excel (Tất cả user đã đăng nhập)
    /// </summary>
    [HttpPost("export")]
    [Authorize]
    public async Task<IActionResult> ExportExcel([FromBody] ExportExcelRequest request)
    {
        try
        {
            var memoryStream = await _service.ExportExcelAsync(request?.Ids);
            var fileName = "Customer_Export.xlsx";

            Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{fileName}\"; filename*=UTF-8''{Uri.EscapeDataString(fileName)}");

            return File(memoryStream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Lỗi khi export: {ex.Message}" });
        }
    }

    /// <summary>
    /// Xóa nhiều khách hàng (Chỉ Admin)
    /// </summary>
    [HttpPost("bulk-delete")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteMultiple([FromBody] List<int> ids)
    {
        try
        {
            await _service.DeleteMultipleAsync(ids);
            return Ok(new { success = true, message = $"Đã xóa {ids.Count} khách hàng thành công" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Lỗi khi xóa: {ex.Message}" });
        }
    }
}

