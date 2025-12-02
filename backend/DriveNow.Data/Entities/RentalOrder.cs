using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class RentalOrder : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int VehicleId { get; set; }
    public int? EmployeeId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Confirmed, InProgress, Completed, Cancelled
    
    // Navigation properties
    public Customer Customer { get; set; } = null!;
    public Vehicle Vehicle { get; set; } = null!;
    public Employee? Employee { get; set; }
}

