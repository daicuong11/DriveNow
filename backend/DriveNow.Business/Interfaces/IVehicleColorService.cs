using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface IVehicleColorService
{
    Task<PagedResult<VehicleColorDto>> GetPagedAsync(PagedRequest request);
    Task<VehicleColorDto?> GetByIdAsync(int id);
    Task<VehicleColorDto> CreateAsync(CreateVehicleColorRequest request);
    Task<VehicleColorDto> UpdateAsync(int id, UpdateVehicleColorRequest request);
    Task DeleteAsync(int id);
    Task<VehicleColorDto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
}

