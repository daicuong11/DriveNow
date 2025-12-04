using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Vehicle;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface IVehicleService
{
    Task<PagedResult<VehicleDto>> GetPagedAsync(PagedRequest request);
    Task<VehicleDto?> GetByIdAsync(int id);
    Task<VehicleDto> CreateAsync(CreateVehicleRequest request);
    Task<VehicleDto> UpdateAsync(int id, UpdateVehicleRequest request);
    Task DeleteAsync(int id);
    Task<VehicleDto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
    Task<List<VehicleDto>> GetAvailableAsync(); // Lấy danh sách xe có sẵn
    Task<List<VehicleHistoryDto>> GetHistoryAsync(int vehicleId); // Lấy lịch sử xe
}

