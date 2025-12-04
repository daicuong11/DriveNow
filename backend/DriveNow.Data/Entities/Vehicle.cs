using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Vehicle : BaseEntity
{
    public string Code { get; set; } = string.Empty; // Biển số xe (VD: 30A-12345)
    public int VehicleTypeId { get; set; }
    public int VehicleBrandId { get; set; }
    public int VehicleColorId { get; set; }
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public int SeatCount { get; set; }
    public string FuelType { get; set; } = string.Empty; // Xăng/Dầu/Điện
    public string LicensePlate { get; set; } = string.Empty; // Biển số đăng ký
    public string? ChassisNumber { get; set; } // Số khung
    public string? EngineNumber { get; set; } // Số máy
    public DateTime? RegistrationDate { get; set; } // Ngày đăng ký
    public DateTime? InsuranceExpiryDate { get; set; } // Ngày hết hạn bảo hiểm
    public string Status { get; set; } = "Available"; // Available, Rented, Maintenance, Repair, OutOfService, InTransit
    public string? CurrentLocation { get; set; } // Vị trí hiện tại
    public decimal DailyRentalPrice { get; set; } // Giá thuê theo ngày
    public string? ImageUrl { get; set; } // URL hình ảnh xe
    public string? Description { get; set; } // Mô tả
    
    // Navigation properties
    public VehicleType VehicleType { get; set; } = null!;
    public VehicleBrand VehicleBrand { get; set; } = null!;
    public VehicleColor VehicleColor { get; set; } = null!;
    public ICollection<VehicleInOut> VehicleInOuts { get; set; } = new List<VehicleInOut>();
    public ICollection<RentalOrder> RentalOrders { get; set; } = new List<RentalOrder>();
}

