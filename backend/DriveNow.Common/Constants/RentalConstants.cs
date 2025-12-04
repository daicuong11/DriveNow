namespace DriveNow.Common.Constants;

/// <summary>
/// Constants cho trạng thái đơn thuê
/// </summary>
public static class RentalStatusConstants
{
    public const string Draft = "Draft";
    public const string Confirmed = "Confirmed";
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Invoiced = "Invoiced";
    public const string Cancelled = "Cancelled";

    public static string GetDisplayName(string status)
    {
        return status switch
        {
            Draft => "Nháp",
            Confirmed => "Đã xác nhận",
            InProgress => "Đang cho thuê",
            Completed => "Đã hoàn thành",
            Invoiced => "Đã xuất hóa đơn",
            Cancelled => "Đã hủy",
            _ => status
        };
    }
}

/// <summary>
/// Constants cho loại khuyến mãi
/// </summary>
public static class PromotionTypeConstants
{
    public const string Percentage = "Percentage";
    public const string FixedAmount = "FixedAmount";
}
