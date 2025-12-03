namespace DriveNow.Business.DTOs.MasterData;

public class SystemConfigDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string Status { get; set; } = "A";
}

public class CreateSystemConfigRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string Status { get; set; } = "A";
}

public class UpdateSystemConfigRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string Status { get; set; } = "A";
}

