using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Invoice;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Data.Interfaces;
using DriveNow.Common.Extensions;
using DriveNow.Common.Constants;

namespace DriveNow.Business.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IRepository<Invoice> _repository;
    private readonly ApplicationDbContext _context;
    private readonly IRentalOrderService _rentalOrderService;

    public InvoiceService(
        IRepository<Invoice> repository,
        ApplicationDbContext context,
        IRentalOrderService rentalOrderService)
    {
        _repository = repository;
        _context = context;
        _rentalOrderService = rentalOrderService;
    }

    private string GenerateInvoiceNumber()
    {
        var today = DateTime.UtcNow;
        var prefix = $"HD{today:yyyyMMdd}";
        var lastInvoice = _context.Invoices
            .Where(i => i.InvoiceNumber.StartsWith(prefix))
            .OrderByDescending(i => i.InvoiceNumber)
            .FirstOrDefault();

        int sequence = 1;
        if (lastInvoice != null)
        {
            var lastSequence = lastInvoice.InvoiceNumber.Substring(prefix.Length);
            if (int.TryParse(lastSequence, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{prefix}{sequence:D3}";
    }

    private string CalculateStatus(decimal paidAmount, decimal totalAmount, DateTime dueDate)
    {
        if (paidAmount >= totalAmount)
        {
            return InvoiceStatusConstants.Paid;
        }
        else if (paidAmount > 0)
        {
            return InvoiceStatusConstants.Partial;
        }
        else if (dueDate < DateTime.UtcNow.Date)
        {
            return InvoiceStatusConstants.Overdue;
        }
        else
        {
            return InvoiceStatusConstants.Unpaid;
        }
    }

    public async Task<PagedResult<InvoiceDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.RentalOrder)
            .Where(i => !i.IsDeleted);

        // Normalize search and filter terms
        string? normalizedSearchTerm = null;
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            normalizedSearchTerm = request.SearchTerm.Trim().NormalizeForSearch();
        }

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.FilterStatus))
        {
            query = query.Where(i => i.Status == request.FilterStatus.Trim());
        }

        var allItems = await query.ToListAsync();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(i =>
                i.InvoiceNumber.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                i.RentalOrder.OrderNumber.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                i.Customer.FullName.NormalizeForSearch().Contains(normalizedSearchTerm)
            ).ToList();
        }

        // Sort
        var sortedItems = request.SortBy?.ToLower() switch
        {
            "invoicenumber" => request.SortDescending ? allItems.OrderByDescending(i => i.InvoiceNumber) : allItems.OrderBy(i => i.InvoiceNumber),
            "invoicedate" => request.SortDescending ? allItems.OrderByDescending(i => i.InvoiceDate) : allItems.OrderBy(i => i.InvoiceDate),
            "totalamount" => request.SortDescending ? allItems.OrderByDescending(i => i.TotalAmount) : allItems.OrderBy(i => i.TotalAmount),
            _ => allItems.OrderByDescending(i => i.CreatedDate)
        };

        var totalCount = sortedItems.Count();
        var pagedItems = sortedItems
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = pagedItems.Select(i => new InvoiceDto
        {
            Id = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            RentalOrderId = i.RentalOrderId,
            RentalOrderNumber = i.RentalOrder.OrderNumber,
            CustomerId = i.CustomerId,
            CustomerName = i.Customer.FullName,
            CustomerPhone = i.Customer.Phone,
            CustomerAddress = i.Customer.Address,
            InvoiceDate = i.InvoiceDate,
            DueDate = i.DueDate,
            SubTotal = i.SubTotal,
            TaxRate = i.TaxRate,
            TaxAmount = i.TaxAmount,
            DiscountAmount = i.DiscountAmount,
            TotalAmount = i.TotalAmount,
            PaidAmount = i.PaidAmount,
            RemainingAmount = i.RemainingAmount,
            Status = i.Status,
            Notes = i.Notes,
            CreatedDate = i.CreatedDate,
            CreatedBy = i.CreatedBy,
            ModifiedDate = i.ModifiedDate,
            ModifiedBy = i.ModifiedBy
        }).ToList();

        return new PagedResult<InvoiceDto>
        {
            Data = dtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<InvoiceDto?> GetByIdAsync(int id)
    {
        var entity = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.RentalOrder)
            .Include(i => i.InvoiceDetails)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

        if (entity == null) return null;

        return new InvoiceDto
        {
            Id = entity.Id,
            InvoiceNumber = entity.InvoiceNumber,
            RentalOrderId = entity.RentalOrderId,
            RentalOrderNumber = entity.RentalOrder.OrderNumber,
            CustomerId = entity.CustomerId,
            CustomerName = entity.Customer.FullName,
            CustomerPhone = entity.Customer.Phone,
            CustomerAddress = entity.Customer.Address,
            InvoiceDate = entity.InvoiceDate,
            DueDate = entity.DueDate,
            SubTotal = entity.SubTotal,
            TaxRate = entity.TaxRate,
            TaxAmount = entity.TaxAmount,
            DiscountAmount = entity.DiscountAmount,
            TotalAmount = entity.TotalAmount,
            PaidAmount = entity.PaidAmount,
            RemainingAmount = entity.RemainingAmount,
            Status = entity.Status,
            Notes = entity.Notes,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            ModifiedDate = entity.ModifiedDate,
            ModifiedBy = entity.ModifiedBy,
            InvoiceDetails = entity.InvoiceDetails.OrderBy(d => d.SortOrder).Select(d => new InvoiceDetailDto
            {
                Id = d.Id,
                InvoiceId = d.InvoiceId,
                Description = d.Description,
                Quantity = d.Quantity,
                UnitPrice = d.UnitPrice,
                Amount = d.Amount,
                SortOrder = d.SortOrder
            }).ToList()
        };
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request)
    {
        // Validate rental order exists and is completed
        var rentalOrder = await _context.RentalOrders
            .Include(r => r.Customer)
            .Include(r => r.Vehicle)
            .FirstOrDefaultAsync(r => r.Id == request.RentalOrderId && !r.IsDeleted);

        if (rentalOrder == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn thuê với ID {request.RentalOrderId}");
        }

        if (rentalOrder.Status != RentalStatusConstants.Completed)
        {
            throw new InvalidOperationException($"Chỉ có thể tạo hóa đơn từ đơn thuê ở trạng thái Đã hoàn thành. Trạng thái hiện tại: {rentalOrder.Status}");
        }

        // Check if invoice already exists for this rental order
        var existingInvoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.RentalOrderId == request.RentalOrderId && !i.IsDeleted);

        if (existingInvoice != null)
        {
            throw new InvalidOperationException($"Đã tồn tại hóa đơn cho đơn thuê {rentalOrder.OrderNumber}");
        }

        // Calculate amounts
        var subTotal = rentalOrder.TotalAmount - request.DiscountAmount;
        var taxAmount = subTotal * (request.TaxRate / 100);
        var totalAmount = subTotal + taxAmount;

        var entity = new Invoice
        {
            InvoiceNumber = GenerateInvoiceNumber(),
            RentalOrderId = request.RentalOrderId,
            CustomerId = rentalOrder.CustomerId,
            InvoiceDate = request.InvoiceDate,
            DueDate = request.DueDate,
            SubTotal = subTotal,
            TaxRate = request.TaxRate,
            TaxAmount = taxAmount,
            DiscountAmount = request.DiscountAmount,
            TotalAmount = totalAmount,
            PaidAmount = 0,
            RemainingAmount = totalAmount,
            Status = InvoiceStatusConstants.Unpaid,
            Notes = request.Notes,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);
        await _context.SaveChangesAsync(); // Save to get Invoice.Id

        // Create invoice detail
        var detail = new InvoiceDetail
        {
            InvoiceId = entity.Id,
            Description = $"Cho thuê xe {rentalOrder.Vehicle.Code} từ {rentalOrder.StartDate:dd/MM/yyyy} đến {rentalOrder.EndDate:dd/MM/yyyy}",
            Quantity = rentalOrder.TotalDays,
            UnitPrice = rentalOrder.DailyRentalPrice,
            Amount = rentalOrder.SubTotal,
            SortOrder = 0,
            CreatedDate = DateTime.UtcNow
        };

        _context.InvoiceDetails.Add(detail);
        await _context.SaveChangesAsync();

        // Update rental order status
        rentalOrder.Status = RentalStatusConstants.Invoiced;
        await _context.SaveChangesAsync();

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin hóa đơn sau khi tạo");
    }

    public async Task<InvoiceDto> CreateFromRentalAsync(CreateInvoiceFromRentalRequest request)
    {
        return await CreateAsync(new CreateInvoiceRequest
        {
            RentalOrderId = request.RentalOrderId,
            InvoiceDate = request.InvoiceDate,
            DueDate = request.DueDate,
            TaxRate = request.TaxRate,
            DiscountAmount = 0, // Will use from rental order
            Notes = request.Notes
        });
    }

    public async Task<InvoiceDto> UpdateAsync(int id, UpdateInvoiceRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn với ID {id}");
        }

        if (entity.Status == InvoiceStatusConstants.Paid || entity.Status == InvoiceStatusConstants.Cancelled)
        {
            throw new InvalidOperationException("Không thể sửa hóa đơn đã thanh toán hoặc đã hủy");
        }

        // Recalculate amounts
        var rentalOrder = await _context.RentalOrders.FindAsync(entity.RentalOrderId);
        if (rentalOrder == null)
        {
            throw new KeyNotFoundException("Không tìm thấy đơn thuê");
        }

        var subTotal = rentalOrder.TotalAmount - request.DiscountAmount;
        var taxAmount = subTotal * (request.TaxRate / 100);
        var totalAmount = subTotal + taxAmount;

        entity.InvoiceDate = request.InvoiceDate;
        entity.DueDate = request.DueDate;
        entity.TaxRate = request.TaxRate;
        entity.DiscountAmount = request.DiscountAmount;
        entity.SubTotal = subTotal;
        entity.TaxAmount = taxAmount;
        entity.TotalAmount = totalAmount;
        entity.RemainingAmount = totalAmount - entity.PaidAmount;
        entity.Status = CalculateStatus(entity.PaidAmount, totalAmount, request.DueDate);
        entity.Notes = request.Notes;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin hóa đơn sau khi cập nhật");
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn với ID {id}");
        }

        if (entity.Status != InvoiceStatusConstants.Unpaid)
        {
            throw new InvalidOperationException("Chỉ có thể xóa hóa đơn chưa thanh toán");
        }

        // Update rental order status back to Completed
        var rentalOrder = await _context.RentalOrders.FindAsync(entity.RentalOrderId);
        if (rentalOrder != null)
        {
            rentalOrder.Status = RentalStatusConstants.Completed;
        }

        await _repository.DeleteAsync(id);
    }

    public async Task<InvoiceDto> CopyAsync(int id)
    {
        var source = await GetByIdAsync(id);
        if (source == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn với ID {id}");
        }

        // Create new invoice from rental order
        return await CreateFromRentalAsync(new CreateInvoiceFromRentalRequest
        {
            RentalOrderId = source.RentalOrderId,
            InvoiceDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(7),
            TaxRate = source.TaxRate,
            Notes = source.Notes
        });
    }

    public async Task<List<PaymentDto>> GetPaymentsAsync(int invoiceId)
    {
        var payments = await _context.Payments
            .Include(p => p.Invoice)
            .ThenInclude(i => i.Customer)
            .Where(p => p.InvoiceId == invoiceId && !p.IsDeleted)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        return payments.Select(p => new PaymentDto
        {
            Id = p.Id,
            PaymentNumber = p.PaymentNumber,
            InvoiceId = p.InvoiceId,
            InvoiceNumber = p.Invoice.InvoiceNumber,
            CustomerName = p.Invoice.Customer.FullName,
            PaymentDate = p.PaymentDate,
            Amount = p.Amount,
            PaymentMethod = p.PaymentMethod,
            BankAccount = p.BankAccount,
            TransactionCode = p.TransactionCode,
            Notes = p.Notes,
            CreatedDate = p.CreatedDate,
            CreatedBy = p.CreatedBy,
            ModifiedDate = p.ModifiedDate,
            ModifiedBy = p.ModifiedBy
        }).ToList();
    }
}

