using DriveNow.Business.Interfaces;
using DriveNow.Business.DTOs.Permission;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using DriveNow.API.Hubs;
using DriveNow.Data.DbContext;

namespace DriveNow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Base authorization - all endpoints require authentication
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;
    private readonly IHubContext<PermissionHub> _hubContext;
    private readonly ApplicationDbContext _context;

    public PermissionsController(
        IPermissionService permissionService,
        IHubContext<PermissionHub> hubContext,
        ApplicationDbContext context)
    {
        _permissionService = permissionService;
        _hubContext = hubContext;
        _context = context;
    }

    /// <summary>
    /// Get all permissions
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllPermissions()
    {
        try
        {
            var permissions = await _permissionService.GetAllPermissionsAsync();
            return Ok(new { success = true, data = permissions });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống", errors = new[] { ex.Message } });
        }
    }

    /// <summary>
    /// Get permissions grouped by category
    /// </summary>
    [HttpGet("groups")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPermissionGroups()
    {
        try
        {
            var groups = await _permissionService.GetPermissionGroupsAsync();
            return Ok(new { success = true, data = groups });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống", errors = new[] { ex.Message } });
        }
    }

    /// <summary>
    /// Get permissions for a specific role
    /// </summary>
    [HttpGet("role/{role}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetRolePermissions(string role)
    {
        try
        {
            var rolePermissions = await _permissionService.GetRolePermissionsDtoAsync(role);
            return Ok(new { success = true, data = rolePermissions });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống", errors = new[] { ex.Message } });
        }
    }

    /// <summary>
    /// Update permissions for a role
    /// </summary>
    [HttpPut("role/{role}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateRolePermissions(string role, [FromBody] UpdateRolePermissionsRequest request)
    {
        try
        {
            if (role != request.Role)
            {
                return BadRequest(new { success = false, message = "Role trong URL và request body không khớp" });
            }

            await _permissionService.UpdateRolePermissionsAsync(role, request.PermissionKeys);
            
            // Notify all users with this role about permission changes via SignalR
            // Only send to role group to avoid duplicate messages (users are in both role and user groups)
            await _hubContext.Clients.Group($"role_{role}").SendAsync("PermissionsUpdated", new
            {
                role = role,
                permissionKeys = request.PermissionKeys
            });
            
            return Ok(new { success = true, message = "Cập nhật phân quyền thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống", errors = new[] { ex.Message } });
        }
    }

    /// <summary>
    /// Get permissions for current user
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyPermissions()
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "Không thể xác định người dùng" });
            }

            var permissions = await _permissionService.GetUserPermissionsAsync(userId);
            return Ok(new { success = true, data = permissions });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống", errors = new[] { ex.Message } });
        }
    }

    /// <summary>
    /// Seed default permissions (Admin only, one-time operation)
    /// </summary>
    [HttpPost("seed")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SeedPermissions()
    {
        try
        {
            await _permissionService.SeedDefaultPermissionsAsync();
            return Ok(new { success = true, message = "Đã seed permissions mặc định thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống", errors = new[] { ex.Message } });
        }
    }
}

