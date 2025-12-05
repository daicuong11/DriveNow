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

