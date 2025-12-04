using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Reflection;

namespace DriveNow.Common.Helpers;

/// <summary>
/// Helper class để export dữ liệu ra PDF file
/// </summary>
public static class PdfExportHelper
{
    static PdfExportHelper()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    /// <summary>
    /// Export Vehicle information to PDF
    /// </summary>
    public static byte[] ExportVehicleToPdf(object vehicle, string title = "Thông tin Xe")
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .AlignCenter()
                    .Text(title)
                    .SemiBold()
                    .FontSize(20)
                    .FontColor(Colors.Blue.Medium);

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(15);

                        // Thông tin cơ bản
                        column.Item().Element(container =>
                        {
                            container
                                .Background(Colors.Grey.Lighten3)
                                .Padding(15)
                                .Border(1)
                                .BorderColor(Colors.Grey.Medium)
                                .Column(col =>
                                {
                                    col.Item().Text("Thông tin cơ bản").FontSize(14).SemiBold();
                                    col.Item().PaddingBottom(10);
                                    var code = GetPropertyValue(vehicle, "Code")?.ToString() ?? "";
                                    var licensePlate = GetPropertyValue(vehicle, "LicensePlate")?.ToString() ?? "";
                                    var vehicleTypeName = GetPropertyValue(vehicle, "VehicleTypeName")?.ToString() ?? "";
                                    var vehicleBrandName = GetPropertyValue(vehicle, "VehicleBrandName")?.ToString() ?? "";
                                    var vehicleColorName = GetPropertyValue(vehicle, "VehicleColorName")?.ToString() ?? "";
                                    var model = GetPropertyValue(vehicle, "Model")?.ToString() ?? "";
                                    var year = GetPropertyValue(vehicle, "Year")?.ToString() ?? "";
                                    var seatCount = GetPropertyValue(vehicle, "SeatCount")?.ToString() ?? "";
                                    var fuelType = GetPropertyValue(vehicle, "FuelType")?.ToString() ?? "";
                                    var dailyRentalPrice = GetPropertyValue<decimal>(vehicle, "DailyRentalPrice");
                                    var status = GetPropertyValue(vehicle, "Status")?.ToString() ?? "";

                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Biển số xe:").FontSize(10);
                                        row.RelativeItem().Text(code).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Biển số đăng ký:").FontSize(10);
                                        row.RelativeItem().Text(licensePlate).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Loại xe:").FontSize(10);
                                        row.RelativeItem().Text(vehicleTypeName).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Hãng xe:").FontSize(10);
                                        row.RelativeItem().Text(vehicleBrandName).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Màu xe:").FontSize(10);
                                        row.RelativeItem().Text(vehicleColorName).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Model:").FontSize(10);
                                        row.RelativeItem().Text(model).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Năm sản xuất:").FontSize(10);
                                        row.RelativeItem().Text(year).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Số chỗ ngồi:").FontSize(10);
                                        row.RelativeItem().Text(seatCount).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Loại nhiên liệu:").FontSize(10);
                                        row.RelativeItem().Text(fuelType).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Giá thuê/ngày:").FontSize(10);
                                        row.RelativeItem().Text(FormatCurrency(dailyRentalPrice)).FontSize(10);
                                    });
                                    col.Item().PaddingTop(5);
                                    col.Item().Row(row =>
                                    {
                                        row.ConstantItem(120).Text("Trạng thái:").FontSize(10);
                                        row.RelativeItem().Text(FormatVehicleStatus(status)).FontSize(10);
                                    });
                                });
                        });

                        // Thông tin đăng ký
                        var chassisNumber = GetPropertyValue(vehicle, "ChassisNumber");
                        var engineNumber = GetPropertyValue(vehicle, "EngineNumber");
                        var registrationDate = GetPropertyValue<DateTime?>(vehicle, "RegistrationDate");
                        var insuranceExpiryDate = GetPropertyValue<DateTime?>(vehicle, "InsuranceExpiryDate");

                        if (!string.IsNullOrWhiteSpace(chassisNumber?.ToString()) || 
                            !string.IsNullOrWhiteSpace(engineNumber?.ToString()) ||
                            registrationDate.HasValue || 
                            insuranceExpiryDate.HasValue)
                        {
                            column.Item().Element(container =>
                            {
                                container
                                    .Background(Colors.Grey.Lighten3)
                                    .Padding(15)
                                    .Border(1)
                                    .BorderColor(Colors.Grey.Medium)
                                    .Column(col =>
                                    {
                                        col.Item().Text("Thông tin đăng ký").FontSize(14).SemiBold();
                                        col.Item().PaddingBottom(10);
                                        
                                        var chassisNumberStr = chassisNumber?.ToString() ?? "";
                                        var engineNumberStr = engineNumber?.ToString() ?? "";
                                        
                                        if (!string.IsNullOrWhiteSpace(chassisNumberStr))
                                        {
                                            col.Item().Row(row =>
                                            {
                                                row.ConstantItem(120).Text("Số khung:").FontSize(10);
                                                row.RelativeItem().Text(chassisNumberStr).FontSize(10);
                                            });
                                            col.Item().PaddingTop(5);
                                        }
                                        
                                        if (!string.IsNullOrWhiteSpace(engineNumberStr))
                                        {
                                            col.Item().Row(row =>
                                            {
                                                row.ConstantItem(120).Text("Số máy:").FontSize(10);
                                                row.RelativeItem().Text(engineNumberStr).FontSize(10);
                                            });
                                            col.Item().PaddingTop(5);
                                        }
                                        
                                        if (registrationDate.HasValue)
                                        {
                                            var regDateStr = FormatDate(registrationDate);
                                            col.Item().Row(row =>
                                            {
                                                row.ConstantItem(120).Text("Ngày đăng ký:").FontSize(10);
                                                row.RelativeItem().Text(regDateStr).FontSize(10);
                                            });
                                            col.Item().PaddingTop(5);
                                        }
                                        
                                        if (insuranceExpiryDate.HasValue)
                                        {
                                            var insDateStr = FormatDate(insuranceExpiryDate);
                                            col.Item().Row(row =>
                                            {
                                                row.ConstantItem(120).Text("Ngày hết hạn BH:").FontSize(10);
                                                row.RelativeItem().Text(insDateStr).FontSize(10);
                                            });
                                        }
                                    });
                            });
                        }

                        // Mô tả
                        var description = GetPropertyValue(vehicle, "Description");
                        if (!string.IsNullOrWhiteSpace(description?.ToString()))
                        {
                            column.Item().Element(container =>
                            {
                                container
                                    .Background(Colors.Grey.Lighten3)
                                    .Padding(15)
                                    .Border(1)
                                    .BorderColor(Colors.Grey.Medium)
                                    .Column(col =>
                                    {
                                        col.Item().Text("Mô tả").FontSize(14).SemiBold();
                                        col.Item().PaddingBottom(10);
                                        var descStr = description?.ToString() ?? "";
                                        col.Item().Text(descStr).FontSize(10);
                                    });
                            });
                        }
                    });

                // Footer
                page.Footer()
                    .AlignCenter()
                    .DefaultTextStyle(x => x.FontSize(9).FontColor(Colors.Grey.Medium))
                    .Text(x =>
                    {
                        x.Span("Trang ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
            });
        });

        return document.GeneratePdf();
    }

    private static object? GetPropertyValue(object obj, string propertyName)
    {
        try
        {
            var type = obj.GetType();
            var property = type.GetProperty(propertyName);
            return property?.GetValue(obj);
        }
        catch
        {
            return null;
        }
    }

    private static T? GetPropertyValue<T>(object obj, string propertyName)
    {
        try
        {
            var value = GetPropertyValue(obj, propertyName);
            if (value == null) return default(T);
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return default(T);
        }
    }

    /// <summary>
    /// Format currency for PDF
    /// </summary>
    public static string FormatCurrency(decimal amount)
    {
        return amount.ToString("N0", System.Globalization.CultureInfo.GetCultureInfo("vi-VN")) + " VNĐ";
    }

    /// <summary>
    /// Format date for PDF
    /// </summary>
    public static string FormatDate(DateTime? date)
    {
        if (!date.HasValue) return string.Empty;
        return date.Value.ToString("dd/MM/yyyy", System.Globalization.CultureInfo.GetCultureInfo("vi-VN"));
    }

    /// <summary>
    /// Format vehicle status for PDF
    /// </summary>
    public static string FormatVehicleStatus(string status)
    {
        return status switch
        {
            "Available" => "Có sẵn",
            "Rented" => "Đang cho thuê",
            "Maintenance" => "Đang bảo dưỡng",
            "Repair" => "Đang sửa chữa",
            "OutOfService" => "Ngừng hoạt động",
            "InTransit" => "Đang vận chuyển",
            _ => status
        };
    }
}

