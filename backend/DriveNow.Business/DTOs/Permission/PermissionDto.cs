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

