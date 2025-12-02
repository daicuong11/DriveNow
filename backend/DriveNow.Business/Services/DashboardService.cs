using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Dashboard;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;

namespace DriveNow.Business.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardOverviewDto> GetOverviewAsync()
    {
        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1);
        var startOfLastMonth = startOfMonth.AddMonths(-1);

        var totalVehicles = await _context.Vehicles.CountAsync(v => !v.IsDeleted);
        var rentedVehicles = await _context.Vehicles.CountAsync(v => !v.IsDeleted && v.Status == "Rented");
        var availableVehicles = await _context.Vehicles.CountAsync(v => !v.IsDeleted && v.Status == "Available");

        var todayRentals = await _context.RentalOrders.CountAsync(r =>
            !r.IsDeleted && r.CreatedDate.Date == today);

        var todayRevenue = await _context.Invoices
            .Where(i => !i.IsDeleted && i.InvoiceDate.Date == today)
            .SumAsync(i => (decimal?)i.PaidAmount) ?? 0;

        var monthlyRevenue = await _context.Invoices
            .Where(i => !i.IsDeleted && i.InvoiceDate >= startOfMonth)
            .SumAsync(i => (decimal?)i.PaidAmount) ?? 0;

        var newCustomers = await _context.Customers.CountAsync(c =>
            !c.IsDeleted && c.CreatedDate >= startOfMonth);

        var unpaidInvoices = await _context.Invoices.CountAsync(i =>
            !i.IsDeleted && (i.Status == "Unpaid" || i.Status == "Partial"));

        return new DashboardOverviewDto
        {
            TotalVehicles = totalVehicles,
            RentedVehicles = rentedVehicles,
            AvailableVehicles = availableVehicles,
            TodayRentals = todayRentals,
            TodayRevenue = todayRevenue,
            MonthlyRevenue = monthlyRevenue,
            NewCustomers = newCustomers,
            UnpaidInvoices = unpaidInvoices
        };
    }
}

