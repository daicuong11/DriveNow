using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Vehicle : BaseEntity
{
    public string LicensePlate { get; set; } = string.Empty;
    public int VehicleTypeId { get; set; }
    public int VehicleBrandId { get; set; }
    public int VehicleColorId { get; set; }
    public string Model { get; set; } = string.Empty;
    public int? Year { get; set; }
    public string Status { get; set; } = "Available"; // Available, Rented, Maintenance, etc.
    
    // Navigation properties
    public VehicleType VehicleType { get; set; } = null!;
    public VehicleBrand VehicleBrand { get; set; } = null!;
    public VehicleColor VehicleColor { get; set; } = null!;
}

