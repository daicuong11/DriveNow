using DriveNow.Business.DTOs.Permission;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace DriveNow.Business.Services;

public class PermissionService : IPermissionService
{
    private readonly ApplicationDbContext _context;

    public PermissionService(ApplicationDbContext context)
    {
        _context = context;
    }

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

    public async Task<RolePermissionDto> GetRolePermissionsDtoAsync(string role)
    {
        var permissionKeys = await GetRolePermissionsAsync(role);
        return new RolePermissionDto
        {
            Role = role,
            PermissionKeys = permissionKeys
        };
    }

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
                    // Other errors, return empty list to allow login
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
                // Other errors, return empty list to allow login
                return new List<string>();
            }
        }
        catch (Exception)
        {
            // If any error occurs, return empty list to allow login
            return new List<string>();
        }
    }

    public async Task SeedDefaultPermissionsAsync()
    {
        // Check if permissions already exist
        if (await _context.Permissions.AnyAsync())
            return;

        var permissions = new List<Permission>
        {
            // Users
            new Permission { Key = "users.view", Name = "Xem danh sách người dùng", Description = "Xem danh sách tất cả người dùng", Category = "users", SortOrder = 1, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "users.create", Name = "Tạo người dùng", Description = "Tạo tài khoản người dùng mới", Category = "users", SortOrder = 2, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "users.edit", Name = "Sửa người dùng", Description = "Cập nhật thông tin người dùng", Category = "users", SortOrder = 3, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "users.delete", Name = "Xóa người dùng", Description = "Xóa tài khoản người dùng", Category = "users", SortOrder = 4, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "users.lock", Name = "Khóa/Mở khóa", Description = "Khóa hoặc mở khóa tài khoản", Category = "users", SortOrder = 5, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "users.resetPassword", Name = "Đặt lại mật khẩu", Description = "Đặt lại mật khẩu cho người dùng", Category = "users", SortOrder = 6, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            
            // System
            new Permission { Key = "system.view", Name = "Xem cấu hình", Description = "Xem cấu hình hệ thống", Category = "system", SortOrder = 1, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "system.edit", Name = "Sửa cấu hình", Description = "Cập nhật cấu hình hệ thống", Category = "system", SortOrder = 2, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            
            // Master Data
            new Permission { Key = "masterdata.view", Name = "Xem danh mục", Description = "Xem tất cả danh mục dữ liệu", Category = "masterdata", SortOrder = 1, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "masterdata.create", Name = "Tạo danh mục", Description = "Tạo mới danh mục dữ liệu", Category = "masterdata", SortOrder = 2, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "masterdata.edit", Name = "Sửa danh mục", Description = "Cập nhật danh mục dữ liệu", Category = "masterdata", SortOrder = 3, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "masterdata.delete", Name = "Xóa danh mục", Description = "Xóa danh mục dữ liệu", Category = "masterdata", SortOrder = 4, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "masterdata.import", Name = "Import Excel", Description = "Import dữ liệu từ Excel", Category = "masterdata", SortOrder = 5, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "masterdata.export", Name = "Export Excel", Description = "Export dữ liệu ra Excel", Category = "masterdata", SortOrder = 6, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            
            // Vehicles
            new Permission { Key = "vehicles.view", Name = "Xem danh sách xe", Description = "Xem danh sách tất cả xe", Category = "vehicles", SortOrder = 1, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "vehicles.create", Name = "Tạo xe mới", Description = "Thêm xe mới vào hệ thống", Category = "vehicles", SortOrder = 2, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "vehicles.edit", Name = "Sửa thông tin xe", Description = "Cập nhật thông tin xe", Category = "vehicles", SortOrder = 3, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "vehicles.delete", Name = "Xóa xe", Description = "Xóa xe khỏi hệ thống", Category = "vehicles", SortOrder = 4, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "vehicles.inout", Name = "Xuất/Nhập bãi", Description = "Quản lý xuất nhập bãi xe", Category = "vehicles", SortOrder = 5, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "vehicles.maintenance", Name = "Bảo dưỡng/Sửa chữa", Description = "Quản lý bảo dưỡng và sửa chữa xe", Category = "vehicles", SortOrder = 6, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            
            // Rentals
            new Permission { Key = "rentals.view", Name = "Xem đơn thuê", Description = "Xem danh sách đơn thuê", Category = "rentals", SortOrder = 1, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "rentals.create", Name = "Tạo đơn thuê", Description = "Tạo đơn thuê mới", Category = "rentals", SortOrder = 2, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "rentals.edit", Name = "Sửa đơn thuê", Description = "Cập nhật đơn thuê", Category = "rentals", SortOrder = 3, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "rentals.delete", Name = "Xóa đơn thuê", Description = "Xóa đơn thuê", Category = "rentals", SortOrder = 4, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "rentals.confirm", Name = "Xác nhận đơn", Description = "Xác nhận đơn thuê", Category = "rentals", SortOrder = 5, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "rentals.start", Name = "Bắt đầu thuê", Description = "Bắt đầu quá trình cho thuê", Category = "rentals", SortOrder = 6, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "rentals.complete", Name = "Hoàn thành", Description = "Hoàn thành đơn thuê", Category = "rentals", SortOrder = 7, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "rentals.cancel", Name = "Hủy đơn", Description = "Hủy đơn thuê", Category = "rentals", SortOrder = 8, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "rentals.promotions", Name = "Quản lý khuyến mãi", Description = "Tạo và quản lý chương trình khuyến mãi", Category = "rentals", SortOrder = 9, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            
            // Invoices
            new Permission { Key = "invoices.view", Name = "Xem hóa đơn", Description = "Xem danh sách hóa đơn", Category = "invoices", SortOrder = 1, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "invoices.create", Name = "Tạo hóa đơn", Description = "Tạo hóa đơn từ đơn thuê", Category = "invoices", SortOrder = 2, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "invoices.edit", Name = "Sửa hóa đơn", Description = "Cập nhật hóa đơn", Category = "invoices", SortOrder = 3, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "invoices.delete", Name = "Xóa hóa đơn", Description = "Xóa hóa đơn", Category = "invoices", SortOrder = 4, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            
            // Payments
            new Permission { Key = "payments.create", Name = "Tạo thanh toán", Description = "Tạo phiếu thanh toán", Category = "invoices", SortOrder = 5, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "payments.view", Name = "Xem thanh toán", Description = "Xem lịch sử thanh toán", Category = "invoices", SortOrder = 6, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            
            // Dashboard & Reports
            new Permission { Key = "dashboard.view", Name = "Xem Dashboard", Description = "Xem dashboard tổng quan", Category = "dashboard", SortOrder = 1, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "reports.view", Name = "Xem báo cáo", Description = "Xem các báo cáo", Category = "dashboard", SortOrder = 2, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false },
            new Permission { Key = "reports.export", Name = "Export báo cáo", Description = "Xuất báo cáo ra file", Category = "dashboard", SortOrder = 3, CreatedDate = DateTime.UtcNow, CreatedBy = "System", IsDeleted = false }
        };

        _context.Permissions.AddRange(permissions);
        await _context.SaveChangesAsync();

        // Seed default role permissions
        var adminPermissions = permissions.Select(p => p.Key).ToList();
        var employeePermissions = new List<string>
        {
            "masterdata.view",
            "vehicles.view",
            "vehicles.inout",
            "rentals.view",
            "rentals.create",
            "rentals.edit",
            "rentals.confirm",
            "rentals.start",
            "rentals.complete",
            "invoices.view",
            "payments.create",
            "payments.view",
            "dashboard.view",
            "reports.view"
        };

        // Add Admin role permissions
        var adminRolePermissions = permissions
            .Where(p => adminPermissions.Contains(p.Key))
            .Select(p => new RolePermission
            {
                Role = "Admin",
                PermissionId = p.Id,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "System",
                IsDeleted = false
            })
            .ToList();

        // Add Employee role permissions
        var employeeRolePermissions = permissions
            .Where(p => employeePermissions.Contains(p.Key))
            .Select(p => new RolePermission
            {
                Role = "Employee",
                PermissionId = p.Id,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "System",
                IsDeleted = false
            })
            .ToList();

        _context.RolePermissions.AddRange(adminRolePermissions);
        _context.RolePermissions.AddRange(employeeRolePermissions);
        await _context.SaveChangesAsync();
    }
}

