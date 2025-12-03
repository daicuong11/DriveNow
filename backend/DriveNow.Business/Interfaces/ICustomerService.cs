using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface ICustomerService
{
    Task<PagedResult<CustomerDto>> GetPagedAsync(PagedRequest request);
    Task<CustomerDto?> GetByIdAsync(int id);
    Task<CustomerDto> CreateAsync(CreateCustomerRequest request);
    Task<CustomerDto> UpdateAsync(int id, UpdateCustomerRequest request);
    Task DeleteAsync(int id);
    Task<CustomerDto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
}

