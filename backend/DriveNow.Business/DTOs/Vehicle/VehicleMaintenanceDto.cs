namespace DriveNow.Business.DTOs.Vehicle;

public class VehicleMaintenanceDto
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleCode { get; set; } = string.Empty;
    public string VehicleModel { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Maintenance, Repair
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal? Cost { get; set; }
    public string? ServiceProvider { get; set; }
    public string Status { get; set; } = "InProgress"; // InProgress, Completed, Cancelled
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateVehicleMaintenanceRequest
{
    public int VehicleId { get; set; }
    public string Type { get; set; } = string.Empty; // Maintenance, Repair
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal? Cost { get; set; }
    public string? ServiceProvider { get; set; }
    public string Status { get; set; } = "InProgress";
}

public class UpdateVehicleMaintenanceRequest
{
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal? Cost { get; set; }
    public string? ServiceProvider { get; set; }
    public string Status { get; set; } = "InProgress";
}

