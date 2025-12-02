using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Customer : BaseMasterEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? IdentityCard { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; } // M/F/O

    // Navigation properties
    public ICollection<RentalOrder> RentalOrders { get; set; } = new List<RentalOrder>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}

