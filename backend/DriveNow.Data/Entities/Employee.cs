using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Employee : BaseMasterEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public DateTime? HireDate { get; set; }

    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<RentalOrder> RentalOrders { get; set; } = new List<RentalOrder>();
    public ICollection<VehicleInOut> VehicleInOuts { get; set; } = new List<VehicleInOut>();
}

