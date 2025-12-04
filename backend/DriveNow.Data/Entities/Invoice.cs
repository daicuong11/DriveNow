using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty; // HD20240101001
    public int RentalOrderId { get; set; }
    public int CustomerId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxRate { get; set; } = 10; // VAT %
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; } = 0;
    public decimal RemainingAmount { get; set; }
    public string Status { get; set; } = "Unpaid"; // Unpaid, Partial, Paid, Overdue, Cancelled
    public string? Notes { get; set; }
    
    // Navigation properties
    public RentalOrder RentalOrder { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public ICollection<InvoiceDetail> InvoiceDetails { get; set; } = new List<InvoiceDetail>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

