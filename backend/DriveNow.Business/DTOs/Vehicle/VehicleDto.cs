namespace DriveNow.Business.DTOs.Vehicle;

public class VehicleDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public int VehicleBrandId { get; set; }
    public string VehicleBrandName { get; set; } = string.Empty;
    public int VehicleColorId { get; set; }
    public string VehicleColorName { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public int SeatCount { get; set; }
    public string FuelType { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public string? ChassisNumber { get; set; }
    public string? EngineNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public DateTime? InsuranceExpiryDate { get; set; }
    public string Status { get; set; } = "Available";
    public string? CurrentLocation { get; set; }
    public decimal DailyRentalPrice { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateVehicleRequest
{
    public string Code { get; set; } = string.Empty;
    public int VehicleTypeId { get; set; }
    public int VehicleBrandId { get; set; }
    public int VehicleColorId { get; set; }
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public int SeatCount { get; set; }
    public string FuelType { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public string? ChassisNumber { get; set; }
    public string? EngineNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public DateTime? InsuranceExpiryDate { get; set; }
    public string Status { get; set; } = "Available";
    public string? CurrentLocation { get; set; }
    public decimal DailyRentalPrice { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
}

public class UpdateVehicleRequest
{
    public int VehicleTypeId { get; set; }
    public int VehicleBrandId { get; set; }
    public int VehicleColorId { get; set; }
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public int SeatCount { get; set; }
    public string FuelType { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public string? ChassisNumber { get; set; }
    public string? EngineNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public DateTime? InsuranceExpiryDate { get; set; }
    public string Status { get; set; } = "Available";
    public string? CurrentLocation { get; set; }
    public decimal DailyRentalPrice { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
}

public class VehicleHistoryDto
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string? OldStatus { get; set; }
    public string? NewStatus { get; set; }
    public int? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
}

