namespace DriveNow.Common.Constants;

/// <summary>
/// Constants cho trạng thái hóa đơn
/// </summary>
public static class InvoiceStatusConstants
{
    public const string Unpaid = "Unpaid";
    public const string Partial = "Partial";
    public const string Paid = "Paid";
    public const string Overdue = "Overdue";
    public const string Cancelled = "Cancelled";

    public static string GetDisplayName(string status)
    {
        return status switch
        {
            Unpaid => "Chưa thanh toán",
            Partial => "Thanh toán một phần",
            Paid => "Đã thanh toán đủ",
            Overdue => "Quá hạn",
            Cancelled => "Đã hủy",
            _ => status
        };
    }
}

/// <summary>
/// Constants cho phương thức thanh toán
/// </summary>
public static class PaymentMethodConstants
{
    public const string Cash = "Cash";
    public const string BankTransfer = "BankTransfer";
    public const string CreditCard = "CreditCard";

    public static string GetDisplayName(string method)
    {
        return method switch
        {
            Cash => "Tiền mặt",
            BankTransfer => "Chuyển khoản",
            CreditCard => "Thẻ tín dụng",
            _ => method
        };
    }
}

