using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class SystemConfig : BaseMasterEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
}

