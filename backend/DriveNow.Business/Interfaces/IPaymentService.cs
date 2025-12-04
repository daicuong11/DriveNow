using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Invoice;

namespace DriveNow.Business.Interfaces;

public interface IPaymentService
{
    Task<PagedResult<PaymentDto>> GetPagedAsync(PagedRequest request);
    Task<PaymentDto?> GetByIdAsync(int id);
    Task<PaymentDto> CreateAsync(CreatePaymentRequest request);
    Task<PaymentDto> UpdateAsync(int id, UpdatePaymentRequest request);
    Task DeleteAsync(int id);
    Task<List<PaymentDto>> GetByInvoiceIdAsync(int invoiceId);
}

