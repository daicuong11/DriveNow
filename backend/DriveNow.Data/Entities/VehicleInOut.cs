using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class VehicleInOut : BaseEntity
{
    public int VehicleId { get; set; }
    public int? EmployeeId { get; set; }
    public string Type { get; set; } = string.Empty; // In, Out
    public DateTime TransactionDate { get; set; }
    public string? Notes { get; set; }
    
    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
    public Employee? Employee { get; set; }
}

