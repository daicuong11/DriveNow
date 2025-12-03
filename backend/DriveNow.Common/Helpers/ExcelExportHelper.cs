using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.Drawing;
using System.Reflection;

namespace DriveNow.Common.Helpers;

/// <summary>
/// Helper class để export dữ liệu ra Excel file
/// </summary>
public static class ExcelExportHelper
{
    /// <summary>
    /// Export dữ liệu ra Excel với column mapping
    /// </summary>
    /// <param name="data">Danh sách dữ liệu cần export</param>
    /// <param name="columnMapping">Dictionary map từ property name sang header name (VD: {"Code", "Mã"}, {"Name", "Tên"})</param>
    /// <param name="sheetName">Tên sheet (mặc định: "Thông tin chung")</param>
    /// <param name="note">Ghi chú (optional)</param>
    /// <param name="minColumnWidth">Độ rộng cột tối thiểu (mặc định: 10)</param>
    /// <param name="maxColumnWidth">Độ rộng cột tối đa (mặc định: 60)</param>
    /// <returns>MemoryStream chứa file Excel</returns>
    public static async Task<MemoryStream> ExportToExcelAsync(
        IEnumerable<object> data,
        Dictionary<string, string> columnMapping,
        string sheetName = "Thông tin chung",
        string note = "",
        double minColumnWidth = 10,
        double maxColumnWidth = 60)
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        var stream = new MemoryStream();

        using (var package = new ExcelPackage(stream))
        {
            var worksheet = package.Workbook.Worksheets.Add(sheetName);

            // === Header ===
            int colIndex = 1;
            foreach (var kvp in columnMapping)
            {
                worksheet.Cells[1, colIndex].Value = kvp.Value;
                worksheet.Cells[1, colIndex].Style.Font.Bold = true;
                worksheet.Cells[1, colIndex].Style.WrapText = true;
                worksheet.Cells[1, colIndex].Style.Fill.PatternType = ExcelFillStyle.Solid;
                worksheet.Cells[1, colIndex].Style.Fill.BackgroundColor.SetColor(Color.White);
                worksheet.Cells[1, colIndex].Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
                worksheet.Cells[1, colIndex].Style.VerticalAlignment = ExcelVerticalAlignment.Center;
                worksheet.Cells[1, colIndex].Style.Border.BorderAround(ExcelBorderStyle.Thin);
                colIndex++;
            }

            // Thiết lập header: không cho phép wrap text và tự động giãn width để hiển thị đầy đủ giá trị header
            if (columnMapping.Count > 0)
            {
                for (int i = 1; i <= columnMapping.Count; i++)
                {
                    // Không cho phép wrap text trên header
                    worksheet.Cells[1, i].Style.WrapText = false;

                    // Tự động điều chỉnh độ rộng cột vừa đủ với nội dung header
                    worksheet.Column(i).AutoFit();
                    worksheet.Column(i).Width = Math.Max(worksheet.Column(i).Width, minColumnWidth);
                    worksheet.Column(i).Width = Math.Min(worksheet.Column(i).Width, maxColumnWidth);
                }
            }

            // Thêm filter cho header sheet data (AutoFilter)
            if (columnMapping.Count > 0)
            {
                worksheet.Cells[1, 1, 1, columnMapping.Count].AutoFilter = true;
                if (worksheet.Dimension != null)
                {
                    worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns(minColumnWidth, maxColumnWidth);
                }
            }

            // Thêm note nếu có
            if (!string.IsNullOrEmpty(note))
            {
                var noteColIndex = columnMapping.Count + 1;
                worksheet.Cells[1, noteColIndex].Value = note;
                worksheet.Cells[1, noteColIndex].Style.Font.Color.SetColor(Color.Red);
                worksheet.Cells[1, noteColIndex].Style.Font.Bold = true;
                worksheet.Cells[1, noteColIndex].Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;

                // Không bật wrap text để autofit width và luôn fix chiều rộng lớn nhất cho note
                worksheet.Cells[1, noteColIndex].Style.WrapText = false;
                worksheet.Column(noteColIndex).AutoFit();

                // Luôn đặt width về max để note hiển thị rộng nhất
                worksheet.Column(noteColIndex).Width = maxColumnWidth;

                // Bật lại wrap text cho nội dung note
                worksheet.Cells[1, noteColIndex].Style.WrapText = true;
            }

            // === Data ===
            int rowIndex = 2;
            foreach (var item in data)
            {
                colIndex = 1;
                foreach (var kvp in columnMapping)
                {
                    var prop = item.GetType().GetProperty(kvp.Key);
                    var value = prop?.GetValue(item);

                    var cell = worksheet.Cells[rowIndex, colIndex];
                    cell.Value = FormatCellValue(value, kvp.Key);
                    colIndex++;
                }
                rowIndex++;
            }

            package.Save(); // Ghi vào stream
        }

        stream.Position = 0;
        return stream;
    }

    /// <summary>
    /// Format giá trị cell dựa trên kiểu dữ liệu
    /// </summary>
    private static object? FormatCellValue(object? value, string propertyName)
    {
        if (value == null)
        {
            return null;
        }

        // Format DateTime
        if (value is DateTime dt)
        {
            return dt.ToString("dd/MM/yyyy");
        }

        if (value is DateTime?)
        {
            var nullableDateTime = (DateTime?)value;
            if (nullableDateTime.HasValue)
            {
                return nullableDateTime.Value.ToString("dd/MM/yyyy");
            }
        }

        // Format Status
        if (propertyName.Equals("Status", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(value?.ToString()))
        {
            string valStatusCode = value.ToString()!.ToUpper();
            return valStatusCode switch
            {
                "A" => "Hoạt động",
                "I" => "Ngưng hoạt động",
                "P" => "Chờ xử lý",
                "D" => "Xóa",
                "O" => "Mở",
                "C" => "Xác nhận",
                _ => value
            };
        }

        // Format boolean
        if (value is bool boolValue)
        {
            return boolValue ? "Có" : "Không";
        }

        // Format decimal/float/double (số tiền)
        if (value is decimal || value is double || value is float)
        {
            return value;
        }

        // Default: return value as is
        return value;
    }
}

