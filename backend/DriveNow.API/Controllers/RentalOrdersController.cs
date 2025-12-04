using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Rental;
using DriveNow.Business.Interfaces;

namespace DriveNow.API.Controllers;

/// <summary>
/// RentalOrders Controller - Quản lý đơn thuê xe
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class RentalOrdersController : ControllerBase
{
    private readonly IRentalOrderService _service;
    private readonly ILogger<RentalOrdersController> _logger;

    public RentalOrdersController(IRentalOrderService service, ILogger<RentalOrdersController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách đơn thuê (có phân trang, tìm kiếm, lọc)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] PagedRequest request)
    {
        var result = await _service.GetPagedAsync(request);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Lấy chi tiết đơn thuê theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { success = false, message = $"Không tìm thấy đơn thuê với ID {id}" });
        }
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Tạo mới đơn thuê
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Create([FromBody] CreateRentalOrderRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            return Ok(new { success = true, data = result, message = "Tạo đơn thuê thành công!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating rental order");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật đơn thuê (chỉ khi Status = Draft)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRentalOrderRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request);
            return Ok(new { success = true, data = result, message = "Cập nhật đơn thuê thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rental order {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa đơn thuê (chỉ khi Status = Draft hoặc Cancelled)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return Ok(new { success = true, message = "Xóa đơn thuê thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting rental order {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Tính giá tự động
    /// </summary>
    [HttpPost("calculate-price")]
    public async Task<IActionResult> CalculatePrice([FromBody] CalculatePriceRequest request)
    {
        try
        {
            var result = await _service.CalculatePriceAsync(request);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating price");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Xác nhận đơn thuê (Draft → Confirmed)
    /// </summary>
    [HttpPost("{id}/confirm")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Confirm(int id)
    {
        try
        {
            var result = await _service.ConfirmAsync(id);
            return Ok(new { success = true, data = result, message = "Xác nhận đơn thuê thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming rental order {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Bắt đầu đơn thuê (Confirmed → InProgress)
    /// </summary>
    [HttpPost("{id}/start")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Start(int id)
    {
        try
        {
            var result = await _service.StartAsync(id);
            return Ok(new { success = true, data = result, message = "Bắt đầu đơn thuê thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting rental order {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Hoàn thành đơn thuê (InProgress → Completed)
    /// </summary>
    [HttpPost("{id}/complete")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Complete(int id, [FromBody] CompleteRentalRequest? request = null)
    {
        try
        {
            var result = await _service.CompleteAsync(id, request?.ActualEndDate, request?.ReturnLocation);
            return Ok(new { success = true, data = result, message = "Hoàn thành đơn thuê thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing rental order {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Hủy đơn thuê
    /// </summary>
    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelRentalRequest? request = null)
    {
        try
        {
            var result = await _service.CancelAsync(id, request?.Reason);
            return Ok(new { success = true, data = result, message = "Hủy đơn thuê thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling rental order {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy lịch sử thay đổi trạng thái đơn thuê
    /// </summary>
    [HttpGet("{id}/history")]
    public async Task<IActionResult> GetStatusHistory(int id)
    {
        try
        {
            var result = await _service.GetStatusHistoryAsync(id);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting status history for rental order {Id}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}

// Helper DTOs for workflow actions
public class CompleteRentalRequest
{
    public DateTime? ActualEndDate { get; set; }
    public string? ReturnLocation { get; set; }
}

public class CancelRentalRequest
{
    public string? Reason { get; set; }
}
