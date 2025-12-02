using DriveNow.Business.DTOs.Dashboard;

namespace DriveNow.Business.Interfaces;

public interface IDashboardService
{
    Task<DashboardOverviewDto> GetOverviewAsync();
}

