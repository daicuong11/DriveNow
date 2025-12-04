using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class VehicleHistory : BaseEntity
{
    public int VehicleId { get; set; }
    public string ActionType { get; set; } = string.Empty; // Rented, Returned, Maintenance, Repair, In, Out, MaintenanceCompleted, RepairCompleted, Created
    public string? OldStatus { get; set; } // Trạng thái cũ
    public string? NewStatus { get; set; } // Trạng thái mới
    public int? ReferenceId { get; set; } // ID tham chiếu (RentalId, MaintenanceId, v.v.)
    public string? ReferenceType { get; set; } // Loại tham chiếu
    public string? Description { get; set; } // Mô tả
    
    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
}

