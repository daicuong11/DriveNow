using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Rental;
using DriveNow.Business.DTOs.MasterData;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Data.Interfaces;
using DriveNow.Common.Extensions;
using DriveNow.Common.Constants;
using DriveNow.Common.Helpers;
using OfficeOpenXml;
using static DriveNow.Common.Constants.ExcelSheetNames;

namespace DriveNow.Business.Services;

public class PromotionService : IPromotionService
{
    private readonly IRepository<Promotion> _repository;
    private readonly ApplicationDbContext _context;

    public PromotionService(IRepository<Promotion> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<PromotionDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.Promotions.Where(p => !p.IsDeleted);

        // Normalize search and filter terms
        string? normalizedSearchTerm = null;
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            normalizedSearchTerm = request.SearchTerm.Trim().NormalizeForSearch();
        }

        // Apply basic filters
        if (!string.IsNullOrWhiteSpace(request.FilterStatus))
        {
            query = query.Where(p => p.Status == request.FilterStatus.Trim());
        }

        var allItems = await query.ToListAsync();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(p =>
                p.Code.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                p.Name.NormalizeForSearch().Contains(normalizedSearchTerm)
            ).ToList();
        }

        // Sort
        var sortedItems = request.SortBy?.ToLower() switch
        {
            "code" => request.SortDescending ? allItems.OrderByDescending(p => p.Code) : allItems.OrderBy(p => p.Code),
            "name" => request.SortDescending ? allItems.OrderByDescending(p => p.Name) : allItems.OrderBy(p => p.Name),
            "startdate" => request.SortDescending ? allItems.OrderByDescending(p => p.StartDate) : allItems.OrderBy(p => p.StartDate),
            _ => allItems.OrderByDescending(p => p.CreatedDate)
        };

        var totalCount = sortedItems.Count();
        var items = sortedItems
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new PromotionDto
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Type = p.Type,
                Value = p.Value,
                MinAmount = p.MinAmount,
                MaxDiscount = p.MaxDiscount,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                UsageLimit = p.UsageLimit,
                UsedCount = p.UsedCount,
                Status = p.Status,
                CreatedDate = p.CreatedDate,
                CreatedBy = p.CreatedBy,
                ModifiedDate = p.ModifiedDate,
                ModifiedBy = p.ModifiedBy
            })
            .ToList();

        return new PagedResult<PromotionDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<PromotionDto?> GetByIdAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return null;

        return new PromotionDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Type = entity.Type,
            Value = entity.Value,
            MinAmount = entity.MinAmount,
            MaxDiscount = entity.MaxDiscount,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            UsageLimit = entity.UsageLimit,
            UsedCount = entity.UsedCount,
            Status = entity.Status,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            ModifiedDate = entity.ModifiedDate,
            ModifiedBy = entity.ModifiedBy
        };
    }

    public async Task<PromotionDto> CreateAsync(CreatePromotionRequest request)
    {
        if (await _context.Promotions.AnyAsync(p => p.Code == request.Code && !p.IsDeleted))
        {
            throw new InvalidOperationException($"Mã khuyến mãi '{request.Code}' đã tồn tại");
        }

        var entity = new Promotion
        {
            Code = request.Code,
            Name = request.Name,
            Type = request.Type,
            Value = request.Value,
            MinAmount = request.MinAmount,
            MaxDiscount = request.MaxDiscount,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            UsageLimit = request.UsageLimit,
            UsedCount = 0,
            Status = request.Status,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        return new PromotionDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Type = entity.Type,
            Value = entity.Value,
            MinAmount = entity.MinAmount,
            MaxDiscount = entity.MaxDiscount,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            UsageLimit = entity.UsageLimit,
            UsedCount = entity.UsedCount,
            Status = entity.Status,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy
        };
    }

    public async Task<PromotionDto> UpdateAsync(int id, UpdatePromotionRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy khuyến mãi với ID {id}");
        }

        entity.Name = request.Name;
        entity.Type = request.Type;
        entity.Value = request.Value;
        entity.MinAmount = request.MinAmount;
        entity.MaxDiscount = request.MaxDiscount;
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.UsageLimit = request.UsageLimit;
        entity.Status = request.Status;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        return new PromotionDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Type = entity.Type,
            Value = entity.Value,
            MinAmount = entity.MinAmount,
            MaxDiscount = entity.MaxDiscount,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            UsageLimit = entity.UsageLimit,
            UsedCount = entity.UsedCount,
            Status = entity.Status,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            ModifiedDate = entity.ModifiedDate,
            ModifiedBy = entity.ModifiedBy
        };
    }

    public async Task DeleteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<PromotionDto> CopyAsync(int id)
    {
        var source = await _repository.GetByIdAsync(id);
        if (source == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy khuyến mãi với ID {id}");
        }

        var baseCode = source.Code;
        var newCode = baseCode;
        var counter = 1;
        while (await _context.Promotions.AnyAsync(p => p.Code == newCode && !p.IsDeleted))
        {
            newCode = $"{baseCode}_{counter}";
            counter++;
        }

        var newEntity = new Promotion
        {
            Code = newCode,
            Name = $"{source.Name} (Copy)",
            Type = source.Type,
            Value = source.Value,
            MinAmount = source.MinAmount,
            MaxDiscount = source.MaxDiscount,
            StartDate = source.StartDate,
            EndDate = source.EndDate,
            UsageLimit = source.UsageLimit,
            UsedCount = 0,
            Status = StatusConstants.Active,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(newEntity);

        return new PromotionDto
        {
            Id = newEntity.Id,
            Code = newEntity.Code,
            Name = newEntity.Name,
            Type = newEntity.Type,
            Value = newEntity.Value,
            MinAmount = newEntity.MinAmount,
            MaxDiscount = newEntity.MaxDiscount,
            StartDate = newEntity.StartDate,
            EndDate = newEntity.EndDate,
            UsageLimit = newEntity.UsageLimit,
            UsedCount = newEntity.UsedCount,
            Status = newEntity.Status,
            CreatedDate = newEntity.CreatedDate
        };
    }

    public Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName)
    {
        // TODO: Implement Excel import for Promotion
        return Task.FromException<ImportExcelResponse>(new NotImplementedException("Excel import for Promotion is not yet implemented"));
    }

    public Task<MemoryStream> ExportExcelAsync(List<int>? ids)
    {
        // TODO: Implement Excel export for Promotion
        return Task.FromException<MemoryStream>(new NotImplementedException("Excel export for Promotion is not yet implemented"));
    }

    public async Task DeleteMultipleAsync(List<int> ids)
    {
        foreach (var id in ids)
        {
            await _repository.DeleteAsync(id);
        }
    }

    public async Task<ValidatePromotionResponse> ValidatePromotionAsync(ValidatePromotionRequest request)
    {
        var promotion = await _context.Promotions
            .FirstOrDefaultAsync(p => p.Code == request.PromotionCode && !p.IsDeleted);

        if (promotion == null)
        {
            return new ValidatePromotionResponse
            {
                IsValid = false,
                Message = "Mã khuyến mãi không tồn tại"
            };
        }

        if (promotion.Status != StatusConstants.Active)
        {
            return new ValidatePromotionResponse
            {
                IsValid = false,
                Message = "Mã khuyến mãi không còn hiệu lực"
            };
        }

        // Check if rental dates are within promotion validity period
        // If StartDate and EndDate are provided, check if rental period overlaps with promotion period
        if (request.StartDate.HasValue && request.EndDate.HasValue)
        {
            var rentalStartDate = request.StartDate.Value.Date;
            var rentalEndDate = request.EndDate.Value.Date;
            var promotionStartDate = promotion.StartDate.Date;
            var promotionEndDate = promotion.EndDate.Date;

            // Check if rental period overlaps with promotion period
            // Rental period must overlap with promotion period (at least one day)
            if (rentalStartDate > promotionEndDate || rentalEndDate < promotionStartDate)
            {
                return new ValidatePromotionResponse
                {
                    IsValid = false,
                    Message = $"Mã khuyến mãi chỉ áp dụng từ {promotionStartDate:dd/MM/yyyy} đến {promotionEndDate:dd/MM/yyyy}"
                };
            }
        }
        else
        {
            // Fallback: check current date if rental dates not provided
            var now = DateTime.UtcNow;
            if (now < promotion.StartDate || now > promotion.EndDate)
            {
                return new ValidatePromotionResponse
                {
                    IsValid = false,
                    Message = "Mã khuyến mãi không còn trong thời gian hiệu lực"
                };
            }
        }

        if (promotion.MinAmount.HasValue && request.SubTotal < promotion.MinAmount.Value)
        {
            return new ValidatePromotionResponse
            {
                IsValid = false,
                Message = $"Đơn hàng phải có giá trị tối thiểu {promotion.MinAmount.Value:N0} VNĐ"
            };
        }

        if (promotion.UsageLimit.HasValue && promotion.UsedCount >= promotion.UsageLimit.Value)
        {
            return new ValidatePromotionResponse
            {
                IsValid = false,
                Message = "Mã khuyến mãi đã hết lượt sử dụng"
            };
        }

        // Calculate discount
        decimal discountAmount = 0;
        if (promotion.Type == PromotionTypeConstants.Percentage)
        {
            discountAmount = request.SubTotal * (promotion.Value / 100);
            if (promotion.MaxDiscount.HasValue && discountAmount > promotion.MaxDiscount.Value)
            {
                discountAmount = promotion.MaxDiscount.Value;
            }
        }
        else if (promotion.Type == PromotionTypeConstants.FixedAmount)
        {
            discountAmount = promotion.Value;
            if (discountAmount > request.SubTotal)
            {
                discountAmount = request.SubTotal;
            }
        }

        return new ValidatePromotionResponse
        {
            IsValid = true,
            Message = "Mã khuyến mãi hợp lệ",
            DiscountAmount = discountAmount,
            Promotion = new PromotionDto
            {
                Id = promotion.Id,
                Code = promotion.Code,
                Name = promotion.Name,
                Type = promotion.Type,
                Value = promotion.Value,
                MinAmount = promotion.MinAmount,
                MaxDiscount = promotion.MaxDiscount,
                StartDate = promotion.StartDate,
                EndDate = promotion.EndDate,
                UsageLimit = promotion.UsageLimit,
                UsedCount = promotion.UsedCount,
                Status = promotion.Status
            }
        };
    }
}
