using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class VehicleColor : BaseMasterEntity
{
    public string Name { get; set; } = string.Empty;
    public string? HexCode { get; set; }

    // Navigation properties
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}

