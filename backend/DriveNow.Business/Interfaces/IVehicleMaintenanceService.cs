using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Vehicle;

namespace DriveNow.Business.Interfaces;

public interface IVehicleMaintenanceService
{
    Task<PagedResult<VehicleMaintenanceDto>> GetPagedAsync(PagedRequest request);
    Task<VehicleMaintenanceDto?> GetByIdAsync(int id);
    Task<VehicleMaintenanceDto> CreateAsync(CreateVehicleMaintenanceRequest request);
    Task<VehicleMaintenanceDto> UpdateAsync(int id, UpdateVehicleMaintenanceRequest request);
    Task DeleteAsync(int id);
    Task<VehicleMaintenanceDto> CompleteAsync(int id);
}

