using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface IVehicleBrandService
{
    Task<PagedResult<VehicleBrandDto>> GetPagedAsync(PagedRequest request);
    Task<VehicleBrandDto?> GetByIdAsync(int id);
    Task<VehicleBrandDto> CreateAsync(CreateVehicleBrandRequest request);
    Task<VehicleBrandDto> UpdateAsync(int id, UpdateVehicleBrandRequest request);
    Task DeleteAsync(int id);
    Task<VehicleBrandDto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
}

