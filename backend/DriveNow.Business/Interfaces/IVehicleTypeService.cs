using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface IVehicleTypeService
{
    Task<PagedResult<VehicleTypeDto>> GetPagedAsync(PagedRequest request);
    Task<VehicleTypeDto?> GetByIdAsync(int id);
    Task<VehicleTypeDto> CreateAsync(CreateVehicleTypeRequest request);
    Task<VehicleTypeDto> UpdateAsync(int id, UpdateVehicleTypeRequest request);
    Task DeleteAsync(int id);
    Task<VehicleTypeDto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
}

