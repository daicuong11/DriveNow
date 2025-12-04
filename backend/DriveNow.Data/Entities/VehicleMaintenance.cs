using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class VehicleMaintenance : BaseEntity
{
    public int VehicleId { get; set; }
    public string Type { get; set; } = string.Empty; // Maintenance, Repair
    public DateTime StartDate { get; set; } // Ngày bắt đầu
    public DateTime? EndDate { get; set; } // Ngày kết thúc
    public string Description { get; set; } = string.Empty; // Mô tả công việc
    public decimal? Cost { get; set; } // Chi phí
    public string? ServiceProvider { get; set; } // Đơn vị thực hiện
    public string Status { get; set; } = "InProgress"; // InProgress, Completed, Cancelled
    
    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
}

