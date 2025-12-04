using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Vehicle;

namespace DriveNow.Business.Interfaces;

public interface IVehicleInOutService
{
    Task<PagedResult<VehicleInOutDto>> GetPagedAsync(PagedRequest request);
    Task<VehicleInOutDto?> GetByIdAsync(int id);
    Task<VehicleInOutDto> CreateAsync(CreateVehicleInOutRequest request);
    Task<VehicleInOutDto> UpdateAsync(int id, UpdateVehicleInOutRequest request);
    Task DeleteAsync(int id);
}

