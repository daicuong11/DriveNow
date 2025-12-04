using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Invoice;

namespace DriveNow.Business.Interfaces;

public interface IInvoiceService
{
    Task<PagedResult<InvoiceDto>> GetPagedAsync(PagedRequest request);
    Task<InvoiceDto?> GetByIdAsync(int id);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request);
    Task<InvoiceDto> CreateFromRentalAsync(CreateInvoiceFromRentalRequest request);
    Task<InvoiceDto> UpdateAsync(int id, UpdateInvoiceRequest request);
    Task DeleteAsync(int id);
    Task<InvoiceDto> CopyAsync(int id);
    Task<List<PaymentDto>> GetPaymentsAsync(int invoiceId);
}

