# Backend User và Permission Management Pattern

## Mục đích

File này mô tả pattern chuẩn để implement hệ thống quản lý người dùng và phân quyền (User & Permission Management) trong backend. Pattern này bao gồm:

- User Management (CRUD, Lock/Unlock, Reset Password)
- Permission-based Authorization (thay vì chỉ Role-based)
- Real-time permission updates với SignalR (PermissionHub)
- Real-time user status updates với SignalR (UserHub) - lock/unlock tài khoản
- JWT Authentication với Refresh Token

**Version:** 1.1  
**Last Updated:** 2025-12-05

---

## PHẦN 1: ENTITIES

### 1.1. User Entity

**Location:** `backend/DriveNow.Data/Entities/User.cs`

**Pattern:**

```csharp
using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "Employee"; // Admin, Employee
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; } = false;
    public DateTime? LockedUntil { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public int? EmployeeId { get; set; }

    // Navigation properties
    public Employee? Employee { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
}
```

**Key Points:**
- Kế thừa từ `BaseEntity` (có `Id`, `CreatedDate`, `ModifiedDate`, `IsDeleted`, etc.)
- `Role` là string, không phải enum (linh hoạt hơn)
- `IsLocked` và `LockedUntil` để khóa tài khoản tạm thời
- `FailedLoginAttempts` để track số lần đăng nhập sai
- Foreign key `EmployeeId` để liên kết với Employee (optional)

### 1.2. Permission Entity

**Location:** `backend/DriveNow.Data/Entities/Permission.cs`

**Pattern:**

```csharp
using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Permission : BaseEntity
{
    public string Key { get; set; } = string.Empty; // e.g., "users.view", "masterdata.create"
    public string Name { get; set; } = string.Empty; // e.g., "Xem danh sách người dùng"
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // e.g., "users", "masterdata", "vehicles"
    public int SortOrder { get; set; } = 0;

    // Navigation properties
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
```

**Key Points:**
- `Key` phải unique và theo format `{category}.{action}` (ví dụ: `users.view`, `vehicles.create`)
- `Category` để nhóm permissions (dùng cho UI grouping)
- `SortOrder` để sắp xếp trong UI
- Kế thừa `BaseEntity` để có soft delete

### 1.3. RolePermission Entity

**Location:** `backend/DriveNow.Data/Entities/RolePermission.cs`

**Pattern:**

```csharp
using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class RolePermission : BaseEntity
{
    public string Role { get; set; } = string.Empty; // "Admin", "Employee"
    public int PermissionId { get; set; }

    // Navigation properties
    public Permission Permission { get; set; } = null!;
}
```

**Key Points:**
- `Role` là string (không phải enum)
- Unique index trên `(Role, PermissionId)` - **quan trọng**: unique index không quan tâm đến `IsDeleted`
- Kế thừa `BaseEntity` để có soft delete (nhưng khi update permissions, dùng hard delete)

---

## PHẦN 2: DATABASE CONFIGURATION

### 2.1. ApplicationDbContext Configuration

**Location:** `backend/DriveNow.Data/DbContext/ApplicationDbContext.cs`

**Pattern:**

```csharp
public DbSet<Permission> Permissions { get; set; }
public DbSet<RolePermission> RolePermissions { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // Permission configuration
    modelBuilder.Entity<Permission>(entity =>
    {
        entity.HasIndex(e => e.Key).IsUnique();
    });

    // RolePermission configuration
    modelBuilder.Entity<RolePermission>(entity =>
    {
        entity.HasIndex(e => new { e.Role, e.PermissionId }).IsUnique();
        entity.HasOne(e => e.Permission)
              .WithMany(e => e.RolePermissions)
              .HasForeignKey(e => e.PermissionId)
              .OnDelete(DeleteBehavior.Cascade);
    });
}
```

**Key Points:**
- Unique index trên `Permission.Key`
- Unique index trên `(RolePermission.Role, RolePermission.PermissionId)`
- Cascade delete: khi xóa Permission, tự động xóa RolePermission

---

## PHẦN 3: DTOs

### 3.1. Permission DTOs

**Location:** `backend/DriveNow.Business/DTOs/Permission/PermissionDto.cs`

**Pattern:**

```csharp
namespace DriveNow.Business.DTOs.Permission;

public class PermissionDto
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class RolePermissionDto
{
    public string Role { get; set; } = string.Empty;
    public List<string> PermissionKeys { get; set; } = new List<string>();
}

public class UpdateRolePermissionsRequest
{
    public string Role { get; set; } = string.Empty;
    public List<string> PermissionKeys { get; set; } = new List<string>();
}

public class PermissionGroupDto
{
    public string Title { get; set; } = string.Empty;
    public List<PermissionDto> Permissions { get; set; } = new List<PermissionDto>();
}
```

**Key Points:**
- `RolePermissionDto` chỉ trả về `PermissionKeys` (string list), không trả về full Permission objects
- `UpdateRolePermissionsRequest` dùng để update permissions cho một role

---

## PHẦN 4: SERVICE INTERFACE

### 4.1. IUserService

**Location:** `backend/DriveNow.Business/Interfaces/IUserService.cs`

**Pattern:**

```csharp
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.User;

namespace DriveNow.Business.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserDto>> GetPagedAsync(PagedRequest request);
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto> CreateAsync(CreateUserRequest request);
    Task<UserDto> UpdateAsync(int id, UpdateUserRequest request);
    Task<bool> DeleteAsync(int id);
    Task<UserDto> LockAsync(int id); // Returns UserDto instead of bool
    Task<UserDto> UnlockAsync(int id); // Returns UserDto instead of bool
    Task<bool> ResetPasswordAsync(int id, ResetUserPasswordRequest request);
}
```

**Key Points:**
- `LockAsync` và `UnlockAsync` trả về `UserDto` (không phải `bool`) để có thông tin đầy đủ về user sau khi lock/unlock
- `UserDto` chứa `IsLocked`, `LockedUntil`, `IsActive` để gửi qua SignalR

### 4.2. IPermissionService

**Location:** `backend/DriveNow.Business/Interfaces/IPermissionService.cs`

**Pattern:**

```csharp
using DriveNow.Business.DTOs.Permission;

namespace DriveNow.Business.Interfaces;

public interface IPermissionService
{
    Task<List<PermissionDto>> GetAllPermissionsAsync();
    Task<List<PermissionGroupDto>> GetPermissionGroupsAsync();
    Task<List<string>> GetRolePermissionsAsync(string role);
    Task<RolePermissionDto> GetRolePermissionsDtoAsync(string role);
    Task UpdateRolePermissionsAsync(string role, List<string> permissionKeys);
    Task<List<string>> GetUserPermissionsAsync(int userId);
    Task SeedDefaultPermissionsAsync();
}
```

**Key Points:**
- `GetAllPermissionsAsync()`: Lấy tất cả permissions (đã filter `IsDeleted`)
- `GetPermissionGroupsAsync()`: Nhóm permissions theo Category
- `GetRolePermissionsAsync()`: Lấy danh sách permission keys cho một role
- `GetUserPermissionsAsync()`: Lấy permissions của user (Admin có tất cả, Employee lấy từ RolePermission)
- `UpdateRolePermissionsAsync()`: Cập nhật permissions cho role (hard delete, không soft delete)

---

## PHẦN 5: SERVICE IMPLEMENTATION

### 5.1. UserService - LockAsync và UnlockAsync

**Location:** `backend/DriveNow.Business/Services/UserService.cs`

**Pattern:**

```csharp
public async Task<UserDto> LockAsync(int id)
{
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
    if (user == null)
    {
        throw new KeyNotFoundException("Người dùng không tồn tại");
    }

    user.IsLocked = true;
    user.LockedUntil = DateTime.UtcNow.AddDays(30); // Lock for 30 days
    await _context.SaveChangesAsync();

    // Reload with Employee navigation
    await _context.Entry(user).Reference(u => u.Employee).LoadAsync();
    return await GetByIdAsync(id) ?? throw new InvalidOperationException("Không thể lấy thông tin người dùng");
}

public async Task<UserDto> UnlockAsync(int id)
{
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
    if (user == null)
    {
        throw new KeyNotFoundException("Người dùng không tồn tại");
    }

    user.IsLocked = false;
    user.LockedUntil = null;
    user.FailedLoginAttempts = 0;
    await _context.SaveChangesAsync();

    // Reload with Employee navigation
    await _context.Entry(user).Reference(u => u.Employee).LoadAsync();
    return await GetByIdAsync(id) ?? throw new InvalidOperationException("Không thể lấy thông tin người dùng");
}
```

**Key Points:**
- Return `UserDto` thay vì `bool` để có thông tin đầy đủ
- Reload Employee navigation property trước khi return
- Dùng `GetByIdAsync` để map sang DTO

### 5.2. PermissionService

**Location:** `backend/DriveNow.Business/Services/PermissionService.cs`

**Location:** `backend/DriveNow.Business/Services/PermissionService.cs`

**Dependencies:**
- `ApplicationDbContext` - DbContext để query

**Key Methods:**

#### 5.1.1. GetAllPermissionsAsync

```csharp
public async Task<List<PermissionDto>> GetAllPermissionsAsync()
{
    var permissions = await _context.Permissions
        .Where(p => !p.IsDeleted)
        .OrderBy(p => p.Category)
        .ThenBy(p => p.SortOrder)
        .ThenBy(p => p.Name)
        .ToListAsync();

    return permissions.Select(p => new PermissionDto
    {
        Id = p.Id,
        Key = p.Key,
        Name = p.Name,
        Description = p.Description,
        Category = p.Category,
        SortOrder = p.SortOrder
    }).ToList();
}
```

#### 5.1.2. GetPermissionGroupsAsync

```csharp
public async Task<List<PermissionGroupDto>> GetPermissionGroupsAsync()
{
    var permissions = await GetAllPermissionsAsync();
    
    var categoryNames = new Dictionary<string, string>
    {
        { "users", "Quản lý Người dùng" },
        { "system", "Cấu hình Hệ thống" },
        { "masterdata", "Danh mục Dữ liệu (Master Data)" },
        { "vehicles", "Quản lý Xe" },
        { "rentals", "Quản lý Cho thuê" },
        { "invoices", "Hóa đơn và Thanh toán" },
        { "dashboard", "Dashboard và Báo cáo" }
    };

    var groups = permissions
        .GroupBy(p => p.Category)
        .Select(g => new PermissionGroupDto
        {
            Title = categoryNames.GetValueOrDefault(g.Key, g.Key),
            Permissions = g.OrderBy(p => p.SortOrder).ThenBy(p => p.Name).ToList()
        })
        .OrderBy(g => g.Title)
        .ToList();

    return groups;
}
```

#### 5.1.3. GetRolePermissionsAsync

```csharp
public async Task<List<string>> GetRolePermissionsAsync(string role)
{
    var rolePermissions = await _context.RolePermissions
        .Include(rp => rp.Permission)
        .Where(rp => rp.Role == role && !rp.IsDeleted && !rp.Permission.IsDeleted)
        .Select(rp => rp.Permission.Key)
        .Distinct()
        .ToListAsync();

    return rolePermissions;
}
```

**Key Points:**
- Filter cả `RolePermission.IsDeleted` và `Permission.IsDeleted`
- Dùng `Distinct()` để tránh duplicate (nếu có)

#### 5.1.4. UpdateRolePermissionsAsync (QUAN TRỌNG)

**Pattern:**

```csharp
public async Task UpdateRolePermissionsAsync(string role, List<string> permissionKeys)
{
    // Get ALL existing role permissions for this role (including deleted ones)
    // This is important because unique index doesn't care about IsDeleted
    var allExistingRolePermissions = await _context.RolePermissions
        .Include(rp => rp.Permission)
        .Where(rp => rp.Role == role)
        .ToListAsync();

    // Get all permissions that should be assigned
    var permissionsToAssign = await _context.Permissions
        .Where(p => !p.IsDeleted && permissionKeys.Contains(p.Key))
        .ToListAsync();

    // Get permission IDs that should be assigned
    var permissionIdsToAssign = permissionsToAssign.Select(p => p.Id).ToHashSet();

    // Process each permission to assign first (before deleting)
    foreach (var permission in permissionsToAssign)
    {
        // Check if RolePermission already exists (even if deleted)
        var existingRolePermission = allExistingRolePermissions
            .FirstOrDefault(rp => rp.PermissionId == permission.Id);

        if (existingRolePermission != null)
        {
            // If it exists but is deleted, restore it
            if (existingRolePermission.IsDeleted)
            {
                existingRolePermission.IsDeleted = false;
                existingRolePermission.ModifiedDate = DateTime.UtcNow;
                existingRolePermission.ModifiedBy = "System";
            }
            // If it's already active, do nothing
        }
        else
        {
            // Create new RolePermission only if it doesn't exist at all
            var rolePermission = new RolePermission
            {
                Role = role,
                PermissionId = permission.Id,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "System",
                IsDeleted = false
            };
            _context.RolePermissions.Add(rolePermission);
        }
    }

    // Hard delete permissions that are not in the new list (both active and deleted)
    // Do this after processing permissions to assign to avoid conflicts
    var permissionsToRemove = allExistingRolePermissions
        .Where(rp => !permissionIdsToAssign.Contains(rp.PermissionId))
        .ToList();

    if (permissionsToRemove.Any())
    {
        _context.RolePermissions.RemoveRange(permissionsToRemove);
    }

    await _context.SaveChangesAsync();
}
```

**Key Points:**
- **QUAN TRỌNG**: Lấy TẤT CẢ existing role permissions (kể cả deleted) vì unique index không quan tâm đến `IsDeleted`
- Xử lý permissions cần assign TRƯỚC (restore nếu deleted, tạo mới nếu chưa tồn tại)
- Hard delete permissions không còn trong danh sách SAU (dùng `RemoveRange`)
- Thứ tự này tránh duplicate key exception

#### 5.1.5. GetUserPermissionsAsync

**Pattern:**

```csharp
public async Task<List<string>> GetUserPermissionsAsync(int userId)
{
    try
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user == null)
            return new List<string>();

        // Admin has all permissions
        if (user.Role == "Admin")
        {
            try
            {
                return await _context.Permissions
                    .Where(p => !p.IsDeleted)
                    .Select(p => p.Key)
                    .ToListAsync();
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Message.Contains("Invalid object name"))
            {
                // Permissions table doesn't exist yet, return empty list
                return new List<string>();
            }
            catch (Exception)
            {
                return new List<string>();
            }
        }

        // Get permissions for user's role
        try
        {
            return await GetRolePermissionsAsync(user.Role);
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Message.Contains("Invalid object name"))
        {
            // RolePermissions or Permissions table doesn't exist yet, return empty list
            return new List<string>();
        }
        catch (Exception)
        {
            return new List<string>();
        }
    }
    catch (Exception)
    {
        // If any error occurs, return empty list to allow login
        return new List<string>();
    }
}
```

**Key Points:**
- Admin luôn có tất cả permissions
- Employee lấy permissions từ RolePermission
- **QUAN TRỌNG**: Catch `SqlException` với message "Invalid object name" để xử lý trường hợp tables chưa tồn tại (khi migration chưa chạy)
- Return empty list thay vì throw exception để không block login

#### 5.1.6. SeedDefaultPermissionsAsync

**Pattern:**

```csharp
public async Task SeedDefaultPermissionsAsync()
{
    // Check if permissions already exist
    if (await _context.Permissions.AnyAsync())
        return;

    var permissions = new List<Permission>
    {
        // Define all permissions here
        new Permission { Key = "users.view", Name = "Xem danh sách người dùng", ... },
        // ... more permissions
    };

    _context.Permissions.AddRange(permissions);
    await _context.SaveChangesAsync();

    // Seed default role permissions
    var adminPermissions = permissions.Select(p => p.Key).ToList();
    var employeePermissions = new List<string> { "masterdata.view", ... };

    // Add Admin role permissions
    var adminRolePermissions = permissions
        .Where(p => adminPermissions.Contains(p.Key))
        .Select(p => new RolePermission { Role = "Admin", PermissionId = p.Id, ... })
        .ToList();

    // Add Employee role permissions
    var employeeRolePermissions = permissions
        .Where(p => employeePermissions.Contains(p.Key))
        .Select(p => new RolePermission { Role = "Employee", PermissionId = p.Id, ... })
        .ToList();

    _context.RolePermissions.AddRange(adminRolePermissions);
    _context.RolePermissions.AddRange(employeeRolePermissions);
    await _context.SaveChangesAsync();
}
```

**Key Points:**
- Chỉ seed nếu chưa có permissions
- Seed cả Permissions và RolePermissions
- Admin có tất cả permissions
- Employee có limited permissions

---

## PHẦN 6: CONTROLLER

### 6.1. PermissionsController

**Location:** `backend/DriveNow.API/Controllers/PermissionsController.cs`

**Pattern:**

```csharp
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

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllPermissions() { ... }

    [HttpGet("groups")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPermissionGroups() { ... }

    [HttpGet("role/{role}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetRolePermissions(string role) { ... }

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
            // Only send to role group to avoid duplicate messages
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

    [HttpGet("me")]
    [Authorize] // Any authenticated user can get their own permissions
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

    [HttpPost("seed")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SeedPermissions() { ... }
}
```

**Key Points:**
- Class-level `[Authorize]` để tất cả endpoints yêu cầu authentication
- Method-level `[Authorize(Roles = "Admin")]` cho các endpoints chỉ Admin mới được dùng
- `GetMyPermissions` chỉ cần `[Authorize]` (không cần Admin)
- `UpdateRolePermissions` gửi SignalR message đến `role_{role}` group sau khi update thành công

### 6.2. UsersController với SignalR Integration

**Location:** `backend/DriveNow.API/Controllers/UsersController.cs`

**Pattern:**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.User;
using DriveNow.Business.Interfaces;
using DriveNow.API.Hubs;

namespace DriveNow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
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

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> Lock(int id)
    {
        try
        {
            var user = await _service.LockAsync(id);
            
            // Notify all users in the users_list group about the lock (for Admin UI refresh)
            await _hubContext.Clients.Group("users_list").SendAsync("UserUpdated", new
            {
                userId = id,
                isLocked = true,
                lockedUntil = user.LockedUntil,
                isActive = user.IsActive
            });
            
            // Notify the specific user if they are online (to force logout)
            await _hubContext.Clients.Group($"user_{id}").SendAsync("AccountLocked", new
            {
                userId = id,
                lockedUntil = user.LockedUntil,
                message = $"Tài khoản của bạn đã bị khóa đến {user.LockedUntil:dd/MM/yyyy HH:mm}"
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
}
```

**Key Points:**
- Inject `IHubContext<UserHub>` vào constructor
- `LockAsync` và `UnlockAsync` trả về `UserDto` (không phải `bool`) để có thông tin đầy đủ
- Gửi `UserUpdated` đến `users_list` group để Admin UI refresh
- Gửi `AccountLocked` đến `user_{id}` group để force logout user bị khóa
- Gửi `AccountUnlocked` đến `user_{id}` group để thông báo user (optional)

---

## PHẦN 7: SIGNALR HUB

### 7.1. PermissionHub

**Location:** `backend/DriveNow.API/Hubs/PermissionHub.cs`

**Pattern:**

```csharp
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace DriveNow.API.Hubs;

[Authorize]
public class PermissionHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Join user to their personal group for targeted updates
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        
        if (!string.IsNullOrEmpty(role))
        {
            // Also join user to their role group for role-based updates
            await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        
        if (!string.IsNullOrEmpty(role))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"role_{role}");
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}
```

**Key Points:**
- `[Authorize]` để chỉ authenticated users mới connect được
- Join vào cả `user_{userId}` và `role_{role}` groups
- Remove khỏi groups khi disconnect

### 7.2. UserHub

**Location:** `backend/DriveNow.API/Hubs/UserHub.cs`

**Pattern:**

```csharp
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace DriveNow.API.Hubs;

/// <summary>
/// SignalR Hub cho User realtime updates (lock/unlock, status changes)
/// </summary>
[Authorize]
public class UserHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Join user to their personal group for targeted updates
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        
        // Join to users_list group if Admin (to receive user list updates)
        if (!string.IsNullOrEmpty(role) && role == "Admin")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "users_list");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        
        if (!string.IsNullOrEmpty(role) && role == "Admin")
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "users_list");
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}
```

**Key Points:**
- `[Authorize]` để chỉ authenticated users mới connect được
- Tất cả users join vào `user_{userId}` group để nhận updates về chính họ
- Admin users join vào `users_list` group để nhận updates về user list (lock/unlock)
- Remove khỏi groups khi disconnect

### 7.3. Program.cs Configuration

**Location:** `backend/DriveNow.API/Program.cs`

**Pattern:**

```csharp
// Register SignalR
builder.Services.AddSignalR();

// JWT Bearer Events - OnMessageReceived for SignalR
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var path = context.HttpContext.Request.Path;
        
        // For SignalR hubs, check query string first (SignalR sends token in query string)
        if (path.StartsWithSegments("/hubs"))
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken))
            {
                context.Token = accessToken;
                return System.Threading.Tasks.Task.CompletedTask;
            }
        }
        
        // For API paths, also check query string
        if (path.StartsWithSegments("/api"))
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken))
            {
                context.Token = accessToken;
                return System.Threading.Tasks.Task.CompletedTask;
            }
        }
        
        // Fallback to Authorization header if no token in query string
        if (string.IsNullOrEmpty(context.Token))
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                context.Token = authHeader.Substring("Bearer ".Length).Trim();
            }
        }
        
        return System.Threading.Tasks.Task.CompletedTask;
    }
};

// Middleware order (IMPORTANT):
app.UseCors("AllowReactApp");
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// SignalR hubs must be mapped AFTER UseAuthentication/UseAuthorization
app.MapHub<PermissionHub>("/hubs/permission");
app.MapHub<UserHub>("/hubs/user");

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.MapControllers();
```

**Key Points:**
- SignalR hubs phải được map SAU `UseAuthentication()` và `UseAuthorization()`
- `OnMessageReceived` xử lý token từ query string (cho SignalR) và Authorization header (cho API)
- Seed permissions trong `Program.cs` sau khi services đã được register

---

## PHẦN 8: AUTHENTICATION INTEGRATION

### 8.1. Include Permissions in Login Response

**Location:** `backend/DriveNow.Business/Services/AuthService.cs`

**Pattern:**

```csharp
// In LoginAsync and RefreshTokenAsync methods, after getting the user:
var permissions = await _permissionService.GetUserPermissionsAsync(user.Id);

return new LoginResponse
{
    AccessToken = accessToken,
    RefreshToken = refreshToken.Token,
    ExpiresIn = int.Parse(_configuration["JwtSettings:ExpirationInMinutes"] ?? "60") * 60,
    User = new UserDto
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        FullName = user.FullName,
        Role = user.Role,
        Permissions = permissions // Include permissions
    },
    Permissions = permissions // Also at root level for convenience
};
```

**Key Points:**
- Include permissions trong `LoginResponse` để frontend có thể lưu vào Redux store
- Permissions được fetch từ `PermissionService.GetUserPermissionsAsync()`

---

## PHẦN 9: DATA SEEDING

### 9.1. Program.cs Seeding

**Location:** `backend/DriveNow.API/Program.cs`

**Pattern:**

```csharp
// Seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        await context.Database.MigrateAsync(); // Apply migrations
        
        await DriveNow.Data.Seed.DataSeeder.SeedAsync(context);
        
        // Seed permissions separately (after services are registered)
        var permissionService = services.GetService<DriveNow.Business.Interfaces.IPermissionService>();
        if (permissionService != null)
        {
            try
            {
                await permissionService.SeedDefaultPermissionsAsync();
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogWarning(ex, "Could not seed permissions. This is normal if tables don't exist yet.");
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}
```

**Key Points:**
- Chạy `MigrateAsync()` trước để đảm bảo tables tồn tại
- Seed permissions sau khi services đã được register
- Catch exception và log warning (không crash app nếu tables chưa tồn tại)

---

## PHẦN 10: COMMON PITFALLS VÀ BEST PRACTICES

### 10.1. Duplicate Key Exception

**Problem:** Khi toggle permissions nhiều lần, có thể gặp duplicate key exception.

**Solution:**
- Luôn lấy TẤT CẢ existing role permissions (kể cả deleted) trước khi update
- Restore deleted records thay vì tạo mới
- Hard delete (không soft delete) để tránh conflict với unique index

### 10.2. Permission Table Not Found

**Problem:** Khi login, có thể gặp "Invalid object name 'Permissions'" nếu migration chưa chạy.

**Solution:**
- Catch `SqlException` với message "Invalid object name" trong `GetUserPermissionsAsync()`
- Return empty list thay vì throw exception
- Đảm bảo `MigrateAsync()` được gọi trong `Program.cs`

### 10.3. SignalR Authentication

**Problem:** SignalR connection bị 401 Unauthorized.

**Solution:**
- Đảm bảo `OnMessageReceived` xử lý token từ query string
- Map SignalR hubs SAU `UseAuthentication()` và `UseAuthorization()`
- Configure Vite proxy để forward WebSocket connections

### 10.4. Multiple API Calls

**Problem:** Khi update permissions, frontend gọi API nhiều lần.

**Solution:**
- Chỉ gửi SignalR message đến role group (không gửi đến từng user group)
- Thêm debounce trong frontend hook (500ms)
- Thêm flag `isProcessingRef` để tránh xử lý đồng thời

### 10.5. User Lock/Unlock Real-time Updates

**Problem:** Khi Admin khóa tài khoản, user vẫn có thể sử dụng hệ thống cho đến khi logout.

**Solution:**
- Tạo `UserHub` để gửi real-time updates về lock/unlock
- Gửi `AccountLocked` event đến `user_{id}` group khi lock
- Frontend lắng nghe `AccountLocked` và force logout ngay lập tức
- Gửi `UserUpdated` event đến `users_list` group để Admin UI refresh

---

## PHẦN 11: API ENDPOINTS SUMMARY

### Permissions
```
GET    /api/Permissions                    # Get all permissions (Admin only)
GET    /api/Permissions/groups            # Get permissions grouped by category (Admin only)
GET    /api/Permissions/role/{role}       # Get permissions for a role (Admin only)
PUT    /api/Permissions/role/{role}       # Update permissions for a role (Admin only)
GET    /api/Permissions/me                # Get current user's permissions (Any authenticated user)
POST   /api/Permissions/seed              # Seed default permissions (Admin only, one-time)
```

### Users (Admin only)
```
GET    /api/Users                         # Get paged users list
GET    /api/Users/{id}                    # Get user by id
POST   /api/Users                         # Create new user
PUT    /api/Users/{id}                    # Update user
DELETE /api/Users/{id}                    # Delete user (soft delete)
POST   /api/Users/{id}/lock              # Lock user account (sends SignalR AccountLocked event)
POST   /api/Users/{id}/unlock            # Unlock user account (sends SignalR AccountUnlocked event)
POST   /api/Users/{id}/reset-password    # Reset user password
```

---

## PHẦN 12: TESTING CHECKLIST

- [ ] Permissions được seed đúng khi app start
- [ ] Admin có tất cả permissions
- [ ] Employee chỉ có permissions được assign
- [ ] Update permissions không gây duplicate key exception
- [ ] SignalR gửi message đúng khi update permissions
- [ ] Frontend nhận và cập nhật permissions real-time
- [ ] Login response có permissions
- [ ] GetMyPermissions endpoint hoạt động cho cả Admin và Employee
- [ ] UserHub connection thành công khi login
- [ ] Lock user account gửi SignalR `AccountLocked` event đến `user_{id}` group
- [ ] Lock user account gửi SignalR `UserUpdated` event đến `users_list` group
- [ ] Unlock user account gửi SignalR `AccountUnlocked` và `UserUpdated` events
- [ ] Frontend nhận `AccountLocked` và force logout user ngay lập tức

---

## PHẦN 13: VERSION HISTORY

- **v1.0 (2025-12-05)**: Initial version với full implementation pattern
- **v1.1 (2025-12-05)**: Added UserHub và SignalR integration cho lock/unlock tài khoản

