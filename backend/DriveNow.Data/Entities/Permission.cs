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

