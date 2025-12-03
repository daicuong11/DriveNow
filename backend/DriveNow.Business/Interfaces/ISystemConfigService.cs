using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface ISystemConfigService
{
    Task<PagedResult<SystemConfigDto>> GetPagedAsync(PagedRequest request);
    Task<SystemConfigDto?> GetByIdAsync(int id);
    Task<SystemConfigDto> CreateAsync(CreateSystemConfigRequest request);
    Task<SystemConfigDto> UpdateAsync(int id, UpdateSystemConfigRequest request);
    Task DeleteAsync(int id);
    Task<SystemConfigDto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
}

