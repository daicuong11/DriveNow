using Microsoft.AspNetCore.Mvc;
using DriveNow.Business.DTOs.Auth;
using DriveNow.Business.Interfaces;

namespace DriveNow.API.Controllers;

/// <summary>
/// Authentication Controller - Xử lý đăng nhập, đăng xuất, quên mật khẩu
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Đăng nhập vào hệ thống
    /// </summary>
    /// <param name="request">Thông tin đăng nhập (username/email và password)</param>
    /// <returns>Access token và refresh token</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(new { success = true, data = response, message = "Đăng nhập thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống", errors = new[] { ex.Message } });
        }
    }

    /// <summary>
    /// Làm mới access token bằng refresh token
    /// </summary>
    /// <param name="request">Refresh token</param>
    /// <returns>Access token và refresh token mới</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(request.RefreshToken);
            return Ok(new { success = true, data = response, message = "Refresh token thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            var token = await _authService.ForgotPasswordAsync(request.Email);
            if (string.IsNullOrEmpty(token))
            {
                // Don't reveal if email exists for security
                return Ok(new { success = true, message = "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu" });
            }
            // Temporary: return token directly (in production, send via email)
            return Ok(new { success = true, data = new { token }, message = "Token đặt lại mật khẩu đã được tạo" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống" });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
            return Ok(new { success = true, message = "Đặt lại mật khẩu thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("change-password")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            return Ok(new { success = true, message = "Đổi mật khẩu thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("logout")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        await _authService.LogoutAsync(request.RefreshToken);
        return Ok(new { success = true, message = "Đăng xuất thành công" });
    }
}

// DTOs for controller
public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class LogoutRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

