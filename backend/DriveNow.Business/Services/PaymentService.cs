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

public class PaymentService : IPaymentService
{
    private readonly IRepository<Payment> _repository;
    private readonly ApplicationDbContext _context;
    private readonly IInvoiceService _invoiceService;

    public PaymentService(
        IRepository<Payment> repository,
        ApplicationDbContext context,
        IInvoiceService invoiceService)
    {
        _repository = repository;
        _context = context;
        _invoiceService = invoiceService;
    }

    private string GeneratePaymentNumber()
    {
        var today = DateTime.UtcNow;
        var prefix = $"PT{today:yyyyMMdd}";
        var lastPayment = _context.Payments
            .Where(p => p.PaymentNumber.StartsWith(prefix))
            .OrderByDescending(p => p.PaymentNumber)
            .FirstOrDefault();

        int sequence = 1;
        if (lastPayment != null)
        {
            var lastSequence = lastPayment.PaymentNumber.Substring(prefix.Length);
            if (int.TryParse(lastSequence, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{prefix}{sequence:D3}";
    }

    public async Task<PagedResult<PaymentDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.Payments
            .Include(p => p.Invoice)
            .ThenInclude(i => i.Customer)
            .Where(p => !p.IsDeleted);

        // Normalize search and filter terms
        string? normalizedSearchTerm = null;
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            normalizedSearchTerm = request.SearchTerm.Trim().NormalizeForSearch();
        }

        var allItems = await query.ToListAsync();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(p =>
                p.PaymentNumber.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                p.Invoice.InvoiceNumber.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                p.Invoice.Customer.FullName.NormalizeForSearch().Contains(normalizedSearchTerm)
            ).ToList();
        }

        // Sort
        var sortedItems = request.SortBy?.ToLower() switch
        {
            "paymentnumber" => request.SortDescending ? allItems.OrderByDescending(p => p.PaymentNumber) : allItems.OrderBy(p => p.PaymentNumber),
            "paymentdate" => request.SortDescending ? allItems.OrderByDescending(p => p.PaymentDate) : allItems.OrderBy(p => p.PaymentDate),
            "amount" => request.SortDescending ? allItems.OrderByDescending(p => p.Amount) : allItems.OrderBy(p => p.Amount),
            _ => allItems.OrderByDescending(p => p.CreatedDate)
        };

        var totalCount = sortedItems.Count();
        var pagedItems = sortedItems
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = pagedItems.Select(p => new PaymentDto
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

        return new PagedResult<PaymentDto>
        {
            Data = dtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<PaymentDto?> GetByIdAsync(int id)
    {
        var entity = await _context.Payments
            .Include(p => p.Invoice)
            .ThenInclude(i => i.Customer)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

        if (entity == null) return null;

        return new PaymentDto
        {
            Id = entity.Id,
            PaymentNumber = entity.PaymentNumber,
            InvoiceId = entity.InvoiceId,
            InvoiceNumber = entity.Invoice.InvoiceNumber,
            CustomerName = entity.Invoice.Customer.FullName,
            PaymentDate = entity.PaymentDate,
            Amount = entity.Amount,
            PaymentMethod = entity.PaymentMethod,
            BankAccount = entity.BankAccount,
            TransactionCode = entity.TransactionCode,
            Notes = entity.Notes,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            ModifiedDate = entity.ModifiedDate,
            ModifiedBy = entity.ModifiedBy
        };
    }

    public async Task<PaymentDto> CreateAsync(CreatePaymentRequest request)
    {
        // Get invoice
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .FirstOrDefaultAsync(i => i.Id == request.InvoiceId && !i.IsDeleted);

        if (invoice == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hóa đơn với ID {request.InvoiceId}");
        }

        if (invoice.Status == InvoiceStatusConstants.Cancelled)
        {
            throw new InvalidOperationException("Không thể thanh toán hóa đơn đã hủy");
        }

        if (invoice.Status == InvoiceStatusConstants.Paid)
        {
            throw new InvalidOperationException("Hóa đơn đã được thanh toán đủ");
        }

        // Validate amount
        if (request.Amount <= 0)
        {
            throw new InvalidOperationException("Số tiền thanh toán phải lớn hơn 0");
        }

        if (request.Amount > invoice.RemainingAmount)
        {
            throw new InvalidOperationException($"Số tiền thanh toán ({request.Amount:N0} VNĐ) không được vượt quá số tiền còn lại ({invoice.RemainingAmount:N0} VNĐ)");
        }

        // Create payment
        var entity = new Payment
        {
            PaymentNumber = GeneratePaymentNumber(),
            InvoiceId = request.InvoiceId,
            PaymentDate = request.PaymentDate,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            BankAccount = request.BankAccount,
            TransactionCode = request.TransactionCode,
            Notes = request.Notes,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        // Update invoice
        invoice.PaidAmount += request.Amount;
        invoice.RemainingAmount -= request.Amount;

        // Update status
        if (invoice.RemainingAmount <= 0)
        {
            invoice.Status = InvoiceStatusConstants.Paid;
            invoice.RemainingAmount = 0; // Ensure it's not negative
        }
        else
        {
            invoice.Status = InvoiceStatusConstants.Partial;
        }

        // Check if overdue
        if (invoice.DueDate < DateTime.UtcNow.Date && invoice.Status != InvoiceStatusConstants.Paid)
        {
            invoice.Status = InvoiceStatusConstants.Overdue;
        }

        invoice.ModifiedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin thanh toán sau khi tạo");
    }

    public async Task<PaymentDto> UpdateAsync(int id, UpdatePaymentRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy thanh toán với ID {id}");
        }

        var invoice = await _context.Invoices.FindAsync(entity.InvoiceId);
        if (invoice == null)
        {
            throw new KeyNotFoundException("Không tìm thấy hóa đơn");
        }

        // Calculate difference
        var amountDifference = request.Amount - entity.Amount;

        // Validate new amount
        if (request.Amount <= 0)
        {
            throw new InvalidOperationException("Số tiền thanh toán phải lớn hơn 0");
        }

        if (amountDifference > 0 && amountDifference > invoice.RemainingAmount)
        {
            throw new InvalidOperationException($"Số tiền tăng thêm ({amountDifference:N0} VNĐ) không được vượt quá số tiền còn lại ({invoice.RemainingAmount:N0} VNĐ)");
        }

        // Update payment
        entity.PaymentDate = request.PaymentDate;
        entity.Amount = request.Amount;
        entity.PaymentMethod = request.PaymentMethod;
        entity.BankAccount = request.BankAccount;
        entity.TransactionCode = request.TransactionCode;
        entity.Notes = request.Notes;
        entity.ModifiedDate = DateTime.UtcNow;

        // Update invoice
        invoice.PaidAmount += amountDifference;
        invoice.RemainingAmount -= amountDifference;

        // Update status
        if (invoice.RemainingAmount <= 0)
        {
            invoice.Status = InvoiceStatusConstants.Paid;
            invoice.RemainingAmount = 0;
        }
        else if (invoice.PaidAmount > 0)
        {
            invoice.Status = InvoiceStatusConstants.Partial;
        }
        else
        {
            invoice.Status = InvoiceStatusConstants.Unpaid;
        }

        // Check if overdue
        if (invoice.DueDate < DateTime.UtcNow.Date && invoice.Status != InvoiceStatusConstants.Paid)
        {
            invoice.Status = InvoiceStatusConstants.Overdue;
        }

        invoice.ModifiedDate = DateTime.UtcNow;
        await _repository.UpdateAsync(entity);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin thanh toán sau khi cập nhật");
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy thanh toán với ID {id}");
        }

        var invoice = await _context.Invoices.FindAsync(entity.InvoiceId);
        if (invoice == null)
        {
            throw new KeyNotFoundException("Không tìm thấy hóa đơn");
        }

        // Update invoice - reverse payment
        invoice.PaidAmount -= entity.Amount;
        invoice.RemainingAmount += entity.Amount;

        // Update status
        if (invoice.PaidAmount <= 0)
        {
            invoice.Status = InvoiceStatusConstants.Unpaid;
            invoice.PaidAmount = 0;
        }
        else if (invoice.PaidAmount < invoice.TotalAmount)
        {
            invoice.Status = InvoiceStatusConstants.Partial;
        }
        else
        {
            invoice.Status = InvoiceStatusConstants.Paid;
        }

        // Check if overdue
        if (invoice.DueDate < DateTime.UtcNow.Date && invoice.Status != InvoiceStatusConstants.Paid)
        {
            invoice.Status = InvoiceStatusConstants.Overdue;
        }

        invoice.ModifiedDate = DateTime.UtcNow;
        await _repository.DeleteAsync(id);
        await _context.SaveChangesAsync();
    }

    public async Task<List<PaymentDto>> GetByInvoiceIdAsync(int invoiceId)
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

