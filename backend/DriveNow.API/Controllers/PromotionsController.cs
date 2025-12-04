using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Rental;
using DriveNow.Business.Interfaces;

namespace DriveNow.API.Controllers;

/// <summary>
/// Promotions Controller - Quản lý khuyến mãi
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class PromotionsController : ControllerBase
{
    private readonly IPromotionService _service;
    private readonly ILogger<PromotionsController> _logger;

    public PromotionsController(IPromotionService service, ILogger<PromotionsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách khuyến mãi (có phân trang, tìm kiếm, lọc)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] PagedRequest request)
    {
        var result = await _service.GetPagedAsync(request);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Lấy chi tiết khuyến mãi theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { success = false, message = $"Không tìm thấy khuyến mãi với ID {id}" });
        }
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Tạo mới khuyến mãi
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreatePromotionRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            return Ok(new { success = true, data = result, message = "Tạo khuyến mãi thành công!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating promotion");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật khuyến mãi
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePromotionRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request);
            return Ok(new { success = true, data = result, message = "Cập nhật khuyến mãi thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating promotion {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa khuyến mãi
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return Ok(new { success = true, message = "Xóa khuyến mãi thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting promotion {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Tạo bản sao khuyến mãi
    /// </summary>
    [HttpPost("{id}/copy")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Copy(int id)
    {
        try
        {
            var result = await _service.CopyAsync(id);
            return Ok(new { success = true, data = result, message = "Tạo bản sao khuyến mãi thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error copying promotion {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Validate mã khuyến mãi
    /// </summary>
    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidatePromotionRequest request)
    {
        try
        {
            var result = await _service.ValidatePromotionAsync(request);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating promotion");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
