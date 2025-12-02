using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class VehicleBrand : BaseMasterEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? Logo { get; set; }
    public string? Description { get; set; }

    // Navigation properties
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}

