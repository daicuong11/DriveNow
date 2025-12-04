using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class RentalStatusHistory : BaseEntity
{
    public int RentalOrderId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public DateTime ChangedDate { get; set; }
    public string? ChangedBy { get; set; }
    public string? Notes { get; set; }
    
    // Navigation properties
    public RentalOrder RentalOrder { get; set; } = null!;
}
