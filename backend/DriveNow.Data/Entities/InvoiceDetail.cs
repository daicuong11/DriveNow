using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class InvoiceDetail : BaseEntity
{
    public int InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public int SortOrder { get; set; } = 0;
    
    // Navigation properties
    public Invoice Invoice { get; set; } = null!;
}

