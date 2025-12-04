namespace DriveNow.Business.DTOs.Rental;

public class RentalOrderDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string VehicleCode { get; set; } = string.Empty;
    public string VehicleModel { get; set; } = string.Empty;
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public string PickupLocation { get; set; } = string.Empty;
    public string ReturnLocation { get; set; } = string.Empty;
    public decimal DailyRentalPrice { get; set; }
    public int TotalDays { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? PromotionCode { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositAmount { get; set; }
    public string Status { get; set; } = "Draft";
    public string? Notes { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateRentalOrderRequest
{
    public int CustomerId { get; set; }
    public int VehicleId { get; set; }
    public int EmployeeId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string PickupLocation { get; set; } = string.Empty;
    public string ReturnLocation { get; set; } = string.Empty;
    public decimal DailyRentalPrice { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public string? PromotionCode { get; set; }
    public decimal DepositAmount { get; set; } = 0;
    public string Status { get; set; } = "Draft";
    public string? Notes { get; set; }
}

public class UpdateRentalOrderRequest
{
    public int CustomerId { get; set; }
    public int VehicleId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string PickupLocation { get; set; } = string.Empty;
    public string ReturnLocation { get; set; } = string.Empty;
    public decimal DailyRentalPrice { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public string? PromotionCode { get; set; }
    public decimal DepositAmount { get; set; } = 0;
    public string? Notes { get; set; }
}

public class CalculatePriceRequest
{
    public int VehicleId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? PromotionCode { get; set; }
}

public class CalculatePriceResponse
{
    public decimal DailyRentalPrice { get; set; }
    public int TotalDays { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PromotionMessage { get; set; }
}

public class RentalStatusHistoryDto
{
    public int Id { get; set; }
    public int RentalOrderId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public DateTime ChangedDate { get; set; }
    public string? ChangedBy { get; set; }
    public string? Notes { get; set; }
}
