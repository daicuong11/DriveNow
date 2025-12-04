using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class RentalOrder : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty; // RO20240101001
    public int CustomerId { get; set; }
    public int VehicleId { get; set; }
    public int EmployeeId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public string PickupLocation { get; set; } = string.Empty;
    public string ReturnLocation { get; set; } = string.Empty;
    public decimal DailyRentalPrice { get; set; }
    public int TotalDays { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public string? PromotionCode { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositAmount { get; set; } = 0;
    public string Status { get; set; } = "Draft"; // Draft, Confirmed, InProgress, Completed, Invoiced, Cancelled
    public string? Notes { get; set; }
    
    // Navigation properties
    public Customer Customer { get; set; } = null!;
    public Vehicle Vehicle { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
    public ICollection<RentalStatusHistory> StatusHistories { get; set; } = new List<RentalStatusHistory>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}

