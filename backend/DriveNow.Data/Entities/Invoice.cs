using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int RentalOrderId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = "Unpaid"; // Unpaid, Partial, Paid
    
    // Navigation properties
    public Customer Customer { get; set; } = null!;
    public RentalOrder RentalOrder { get; set; } = null!;
}

