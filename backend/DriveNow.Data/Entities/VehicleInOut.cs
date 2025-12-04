using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class VehicleInOut : BaseEntity
{
    public int VehicleId { get; set; }
    public string Type { get; set; } = string.Empty; // In, Out
    public DateTime Date { get; set; } // Ngày giờ xuất/nhập
    public string? Location { get; set; } // Địa điểm
    public string? Reason { get; set; } // Lý do
    public int EmployeeId { get; set; } // Nhân viên thực hiện
    public string? Notes { get; set; } // Ghi chú
    
    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
}

