using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.User;
using DriveNow.Business.Interfaces;
using DriveNow.API.Hubs;

namespace DriveNow.API.Controllers;

/// <summary>
/// Users Controller - Quản lý người dùng (Chỉ Admin)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;
    private readonly ILogger<UsersController> _logger;
    private readonly IHubContext<UserHub> _hubContext;

    public UsersController(IUserService service, ILogger<UsersController> logger, IHubContext<UserHub> hubContext)
    {
        _service = service;
        _logger = logger;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Lấy danh sách người dùng (có phân trang, tìm kiếm, lọc)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] PagedRequest request)
    {
        var result = await _service.GetPagedAsync(request);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Lấy chi tiết người dùng
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy người dùng" });
        }
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Tạo mới người dùng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            return Ok(new { success = true, data = result, message = "Tạo người dùng thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật người dùng
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request);
            return Ok(new { success = true, data = result, message = "Cập nhật người dùng thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa người dùng (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return Ok(new { success = true, message = "Xóa người dùng thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Khóa tài khoản người dùng
    /// </summary>
    [HttpPost("{id}/lock")]
    public async Task<IActionResult> Lock(int id)
    {
        try
        {
            var user = await _service.LockAsync(id);
            
            // Notify all users in the users_list group about the lock
            await _hubContext.Clients.Group("users_list").SendAsync("UserUpdated", new
            {
                userId = id,
                isLocked = true,
                lockedUntil = user.LockedUntil,
                isActive = user.IsActive
            });
            
            // Also notify the specific user if they are online
            await _hubContext.Clients.Group($"user_{id}").SendAsync("AccountLocked", new
            {
                userId = id,
                lockedUntil = user.LockedUntil
            });
            
            return Ok(new { success = true, message = "Khóa tài khoản thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error locking user {UserId}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Mở khóa tài khoản người dùng
    /// </summary>
    [HttpPost("{id}/unlock")]
    public async Task<IActionResult> Unlock(int id)
    {
        try
        {
            var user = await _service.UnlockAsync(id);
            
            // Notify all users in the users_list group about the unlock (for Admin UI refresh)
            await _hubContext.Clients.Group("users_list").SendAsync("UserUpdated", new
            {
                userId = id,
                isLocked = false,
                lockedUntil = (DateTime?)null,
                isActive = user.IsActive
            });
            
            // Notify the specific user if they are online (optional - can inform user)
            await _hubContext.Clients.Group($"user_{id}").SendAsync("AccountUnlocked", new
            {
                userId = id,
                message = "Tài khoản của bạn đã được mở khóa"
            });
            
            return Ok(new { success = true, message = "Mở khóa tài khoản thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unlocking user {UserId}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Đặt lại mật khẩu cho người dùng
    /// </summary>
    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetUserPasswordRequest request)
    {
        try
        {
            await _service.ResetPasswordAsync(id, request);
            return Ok(new { success = true, message = "Đặt lại mật khẩu thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", id);
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}

