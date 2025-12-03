using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface IEmployeeService
{
    Task<PagedResult<EmployeeDto>> GetPagedAsync(PagedRequest request);
    Task<EmployeeDto?> GetByIdAsync(int id);
    Task<EmployeeDto> CreateAsync(CreateEmployeeRequest request);
    Task<EmployeeDto> UpdateAsync(int id, UpdateEmployeeRequest request);
    Task DeleteAsync(int id);
    Task<EmployeeDto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
}

