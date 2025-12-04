namespace DriveNow.Common.Constants;

/// <summary>
/// Constants cho trạng thái xe
/// </summary>
public static class VehicleStatusConstants
{
    public const string Available = "Available";
    public const string Rented = "Rented";
    public const string Maintenance = "Maintenance";
    public const string Repair = "Repair";
    public const string OutOfService = "OutOfService";
    public const string InTransit = "InTransit";
}

/// <summary>
/// Constants cho loại nhiên liệu
/// </summary>
public static class FuelTypeConstants
{
    public const string Gasoline = "Xăng";
    public const string Diesel = "Dầu";
    public const string Electric = "Điện";
}

/// <summary>
/// Constants cho loại xuất/nhập bãi
/// </summary>
public static class VehicleInOutTypeConstants
{
    public const string In = "In";
    public const string Out = "Out";
}

/// <summary>
/// Constants cho loại bảo dưỡng/sửa chữa
/// </summary>
public static class VehicleMaintenanceTypeConstants
{
    public const string Maintenance = "Maintenance";
    public const string Repair = "Repair";
}

/// <summary>
/// Constants cho trạng thái bảo dưỡng/sửa chữa
/// </summary>
public static class VehicleMaintenanceStatusConstants
{
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

/// <summary>
/// Constants cho loại hành động trong lịch sử xe
/// </summary>
public static class VehicleHistoryActionTypeConstants
{
    public const string Created = "Created";
    public const string Rented = "Rented";
    public const string Returned = "Returned";
    public const string Maintenance = "Maintenance";
    public const string Repair = "Repair";
    public const string MaintenanceCompleted = "MaintenanceCompleted";
    public const string RepairCompleted = "RepairCompleted";
    public const string In = "In";
    public const string Out = "Out";
}

