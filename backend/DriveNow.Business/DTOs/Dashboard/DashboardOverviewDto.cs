namespace DriveNow.Business.DTOs.Dashboard;

public class DashboardOverviewDto
{
    public int TotalVehicles { get; set; }
    public int RentedVehicles { get; set; }
    public int AvailableVehicles { get; set; }
    public int TodayRentals { get; set; }
    public decimal TodayRevenue { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public int NewCustomers { get; set; }
    public int UnpaidInvoices { get; set; }
}

