using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Rental;
using DriveNow.Business.DTOs.MasterData;

namespace DriveNow.Business.Interfaces;

public interface IPromotionService
{
    Task<PagedResult<PromotionDto>> GetPagedAsync(PagedRequest request);
    Task<PromotionDto?> GetByIdAsync(int id);
    Task<PromotionDto> CreateAsync(CreatePromotionRequest request);
    Task<PromotionDto> UpdateAsync(int id, UpdatePromotionRequest request);
    Task DeleteAsync(int id);
    Task<PromotionDto> CopyAsync(int id);
    Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName);
    Task<MemoryStream> ExportExcelAsync(List<int>? ids);
    Task DeleteMultipleAsync(List<int> ids);
    Task<ValidatePromotionResponse> ValidatePromotionAsync(ValidatePromotionRequest request);
}
