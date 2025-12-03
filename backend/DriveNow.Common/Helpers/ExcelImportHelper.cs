using OfficeOpenXml;
using System.Text;

namespace DriveNow.Common.Helpers;

/// <summary>
/// Helper class để import dữ liệu từ Excel file
/// </summary>
public static class ExcelImportHelper
{
    /// <summary>
    /// Validate sheet name có đúng với expected sheet name không
    /// </summary>
    public static bool ValidateSheetName(ExcelWorksheet worksheet, string expectedSheetName)
    {
        if (worksheet == null)
            return false;

        var actualSheetName = worksheet.Name?.Trim();
        var expected = expectedSheetName.Trim();

        // So sánh không phân biệt hoa thường và bỏ qua khoảng trắng
        return string.Equals(actualSheetName, expected, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Parse DateTime từ Excel cell (chỉ chấp nhận định dạng dd/MM/yyyy, dd-MM-yyyy, dd.MM.yyyy)
    /// </summary>
    public static (DateTime? Value, string? Error) TryParseDateTime(object? cellValue, string fieldDisplayName, string? customError = null)
    {
        if (cellValue == null || string.IsNullOrWhiteSpace(cellValue.ToString()))
            return (null, null);

        // Nếu cellValue đã là DateTime (từ Excel formatted cell), return trực tiếp
        if (cellValue is DateTime dateTime)
        {
            // Check range
            if (dateTime < new DateTime(1900, 1, 1) || dateTime > new DateTime(2100, 12, 31))
            {
                return (null, customError ?? $"{fieldDisplayName} nằm ngoài phạm vi cho phép (1900-2100)");
            }
            return (dateTime, null);
        }

        // Nếu là số (Excel date serial number)
        if (cellValue is double || cellValue is int || cellValue is decimal)
        {
            try
            {
                var serialNumber = Convert.ToDouble(cellValue);
                var excelDate = DateTime.FromOADate(serialNumber);

                // Check range
                if (excelDate < new DateTime(1900, 1, 1) || excelDate > new DateTime(2100, 12, 31))
                {
                    return (null, customError ?? $"{fieldDisplayName} nằm ngoài phạm vi cho phép (1900-2100)");
                }
                return (excelDate, null);
            }
            catch
            {
                return (null, customError ?? $"{fieldDisplayName} không hợp lệ (định dạng yêu cầu dd/MM/yyyy)");
            }
        }

        // Nếu là string, thử parse các định dạng
        var stringValue = cellValue.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(stringValue))
            return (null, null);

        var formats = new[] { "dd/MM/yyyy", "dd-MM-yyyy", "dd.MM.yyyy", "d/M/yyyy", "d-M-yyyy", "d.M.yyyy" };
        foreach (var format in formats)
        {
            if (DateTime.TryParseExact(stringValue, format, null, System.Globalization.DateTimeStyles.None, out var parsedDate))
            {
                if (parsedDate < new DateTime(1900, 1, 1) || parsedDate > new DateTime(2100, 12, 31))
                {
                    return (null, customError ?? $"{fieldDisplayName} nằm ngoài phạm vi cho phép (1900-2100)");
                }
                return (parsedDate, null);
            }
        }

        return (null, customError ?? $"{fieldDisplayName} không hợp lệ (định dạng yêu cầu dd/MM/yyyy)");
    }

    /// <summary>
    /// Parse Status từ text sang code (VD: "Hoạt động" -> "A", "Không hoạt động" -> "I")
    /// </summary>
    public static (string? Value, string? Error) TryParseStatus(object? cellValue, string fieldDisplayName, string? customError = null)
    {
        if (cellValue == null || string.IsNullOrWhiteSpace(cellValue.ToString()))
            return (null, null);

        var stringValue = cellValue.ToString()!.Trim();

        // Map các giá trị text sang code
        var statusMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Hoạt động", "A" },
            { "Active", "A" },
            { "A", "A" },
            { "Không hoạt động", "I" },
            { "Inactive", "I" },
            { "Ngưng hoạt động", "I" },
            { "I", "I" }
        };

        if (statusMap.TryGetValue(stringValue, out var code))
        {
            return (code, null);
        }

        return (null, customError ?? $"{fieldDisplayName} không hợp lệ. Chấp nhận: Hoạt động/A, Không hoạt động/I");
    }

    /// <summary>
    /// Validate required field
    /// </summary>
    public static string? ValidateRequired(object? cellValue, string fieldDisplayName)
    {
        if (cellValue == null || string.IsNullOrWhiteSpace(cellValue.ToString()))
        {
            return $"{fieldDisplayName} là bắt buộc";
        }
        return null;
    }

    /// <summary>
    /// Validate max length
    /// </summary>
    public static string? ValidateMaxLength(object? cellValue, string fieldDisplayName, int maxLength)
    {
        if (cellValue == null)
            return null;

        var stringValue = cellValue.ToString();
        if (!string.IsNullOrWhiteSpace(stringValue) && stringValue.Length > maxLength)
        {
            return $"{fieldDisplayName} không được vượt quá {maxLength} ký tự";
        }
        return null;
    }

    /// <summary>
    /// Tổng hợp danh sách lỗi thành chuỗi
    /// </summary>
    public static string AggregateErrors(List<(int Row, string Message)> errors)
    {
        if (errors == null || errors.Count == 0)
            return string.Empty;

        var sb = new StringBuilder();
        foreach (var error in errors)
        {
            sb.AppendLine($"Dòng {error.Row}: {error.Message}");
        }
        return sb.ToString().TrimEnd();
    }

    /// <summary>
    /// Đọc header row từ Excel worksheet
    /// </summary>
    public static Dictionary<string, int> ReadHeaders(ExcelWorksheet worksheet, int headerRow = 1)
    {
        var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        if (worksheet == null || worksheet.Dimension == null)
            return headers;

        for (int col = 1; col <= worksheet.Dimension.Columns; col++)
        {
            var headerValue = worksheet.Cells[headerRow, col].Value?.ToString()?.Trim();
            if (!string.IsNullOrWhiteSpace(headerValue))
            {
                headers[headerValue] = col;
            }
        }

        return headers;
    }

    /// <summary>
    /// Lấy giá trị cell từ Excel worksheet
    /// </summary>
    public static object? GetCellValue(ExcelWorksheet worksheet, int row, int col)
    {
        if (worksheet == null)
            return null;

        return worksheet.Cells[row, col].Value;
    }

    /// <summary>
    /// Lấy column index từ headers dictionary (hỗ trợ nhiều tên cột)
    /// </summary>
    public static int GetColumnIndex(Dictionary<string, int> headers, params string[] columnNames)
    {
        foreach (var columnName in columnNames)
        {
            if (headers.ContainsKey(columnName))
            {
                return headers[columnName];
            }
        }
        return -1; // Not found
    }
}

