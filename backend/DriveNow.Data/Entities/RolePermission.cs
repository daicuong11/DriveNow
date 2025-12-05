using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class RolePermission : BaseEntity
{
    public string Role { get; set; } = string.Empty; // "Admin", "Employee"
    public int PermissionId { get; set; }

    // Navigation properties
    public Permission Permission { get; set; } = null!;
}

