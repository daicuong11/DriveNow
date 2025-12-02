namespace DriveNow.Business.DTOs.MasterData;

public class VehicleBrandDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? Logo { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "A";
}

public class CreateVehicleBrandRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? Logo { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "A";
}

public class UpdateVehicleBrandRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? Logo { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "A";
}

