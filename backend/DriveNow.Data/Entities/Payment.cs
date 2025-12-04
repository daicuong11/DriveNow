using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Payment : BaseEntity
{
    public string PaymentNumber { get; set; } = string.Empty; // PT20240101001
    public int InvoiceId { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // Cash, BankTransfer, CreditCard
    public string? BankAccount { get; set; }
    public string? TransactionCode { get; set; }
    public string? Notes { get; set; }
    
    // Navigation properties
    public Invoice Invoice { get; set; } = null!;
}

