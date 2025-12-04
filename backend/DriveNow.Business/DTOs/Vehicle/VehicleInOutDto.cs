namespace DriveNow.Business.DTOs.Vehicle;

public class VehicleInOutDto
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleCode { get; set; } = string.Empty;
    public string VehicleModel { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // In, Out
    public DateTime Date { get; set; }
    public string? Location { get; set; }
    public string? Reason { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateVehicleInOutRequest
{
    public int VehicleId { get; set; }
    public string Type { get; set; } = string.Empty; // In, Out
    public DateTime Date { get; set; }
    public string? Location { get; set; }
    public string? Reason { get; set; }
    public int EmployeeId { get; set; }
    public string? Notes { get; set; }
}

public class UpdateVehicleInOutRequest
{
    public DateTime Date { get; set; }
    public string? Location { get; set; }
    public string? Reason { get; set; }
    public int EmployeeId { get; set; }
    public string? Notes { get; set; }
}

