using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Rental;

namespace DriveNow.Business.Interfaces;

public interface IRentalOrderService
{
    Task<PagedResult<RentalOrderDto>> GetPagedAsync(PagedRequest request);
    Task<RentalOrderDto?> GetByIdAsync(int id);
    Task<RentalOrderDto> CreateAsync(CreateRentalOrderRequest request);
    Task<RentalOrderDto> UpdateAsync(int id, UpdateRentalOrderRequest request);
    Task DeleteAsync(int id);
    Task<CalculatePriceResponse> CalculatePriceAsync(CalculatePriceRequest request);
    Task<RentalOrderDto> ConfirmAsync(int id);
    Task<RentalOrderDto> StartAsync(int id);
    Task<RentalOrderDto> CompleteAsync(int id, DateTime? actualEndDate, string? returnLocation);
    Task<RentalOrderDto> CancelAsync(int id, string? reason);
    Task<List<RentalStatusHistoryDto>> GetStatusHistoryAsync(int rentalOrderId);
}
