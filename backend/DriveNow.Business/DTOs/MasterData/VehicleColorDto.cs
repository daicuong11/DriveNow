namespace DriveNow.Business.DTOs.MasterData;

public class VehicleColorDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? HexCode { get; set; }
    public string Status { get; set; } = "A";
}

public class CreateVehicleColorRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? HexCode { get; set; }
    public string Status { get; set; } = "A";
}

public class UpdateVehicleColorRequest
{
    public string Name { get; set; } = string.Empty;
    public string? HexCode { get; set; }
    public string Status { get; set; } = "A";
}

