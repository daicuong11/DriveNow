using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Data.Interfaces;
using DriveNow.Common.Extensions;

namespace DriveNow.Business.Services;

public class VehicleBrandService : IVehicleBrandService
{
    private readonly IRepository<VehicleBrand> _repository;
    private readonly ApplicationDbContext _context;

    public VehicleBrandService(IRepository<VehicleBrand> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<VehicleBrandDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.VehicleBrands.Where(v => !v.IsDeleted);

        // Normalize search and filter terms first (for diacritic-insensitive search)
        string? normalizedSearchTerm = null;
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            normalizedSearchTerm = request.SearchTerm.Trim().NormalizeForSearch();
        }

        string? normalizedFilterCode = null;
        if (!string.IsNullOrWhiteSpace(request.FilterCode))
        {
            normalizedFilterCode = request.FilterCode.Trim().NormalizeForSearch();
        }

        string? normalizedFilterName = null;
        if (!string.IsNullOrWhiteSpace(request.FilterName))
        {
            normalizedFilterName = request.FilterName.Trim().NormalizeForSearch();
        }

        string? normalizedFilterCountry = null;
        if (!string.IsNullOrWhiteSpace(request.FilterCountry))
        {
            normalizedFilterCountry = request.FilterCountry.Trim().NormalizeForSearch();
        }

        string? normalizedFilterDescription = null;
        if (!string.IsNullOrWhiteSpace(request.FilterDescription))
        {
            normalizedFilterDescription = request.FilterDescription.Trim().NormalizeForSearch();
        }

        // Apply basic filters that can be translated to SQL
        if (!string.IsNullOrWhiteSpace(request.FilterStatus))
        {
            var filterStatus = request.FilterStatus.Trim();
            query = query.Where(v => v.Status == filterStatus);
        }

        // Materialize query to apply diacritic-insensitive filters in memory
        var allItems = await query.ToListAsync();

        // Apply search filter (case-insensitive, diacritic-insensitive)
        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(v =>
                v.Code.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.Name.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                (v.Description != null && v.Description.NormalizeForSearch().Contains(normalizedSearchTerm))
            ).ToList();
        }

        // Apply advanced filters (case-insensitive, diacritic-insensitive)
        if (!string.IsNullOrWhiteSpace(normalizedFilterCode))
        {
            allItems = allItems.Where(v => v.Code.NormalizeForSearch().Contains(normalizedFilterCode)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(normalizedFilterName))
        {
            allItems = allItems.Where(v => v.Name.NormalizeForSearch().Contains(normalizedFilterName)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(normalizedFilterCountry))
        {
            allItems = allItems.Where(v => v.Country != null && v.Country.NormalizeForSearch().Contains(normalizedFilterCountry)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(normalizedFilterDescription))
        {
            allItems = allItems.Where(v => v.Description != null && v.Description.NormalizeForSearch().Contains(normalizedFilterDescription)).ToList();
        }

        // Sort
        var sortedItems = request.SortBy?.ToLower() switch
        {
            "code" => request.SortDescending ? allItems.OrderByDescending(v => v.Code) : allItems.OrderBy(v => v.Code),
            "name" => request.SortDescending ? allItems.OrderByDescending(v => v.Name) : allItems.OrderBy(v => v.Name),
            _ => allItems.OrderBy(v => v.Code)
        };

        var totalCount = sortedItems.Count();
        var items = sortedItems
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(v => new VehicleBrandDto
            {
                Id = v.Id,
                Code = v.Code,
                Name = v.Name,
                Country = v.Country,
                Logo = v.Logo,
                Description = v.Description,
                Status = v.Status
            })
            .ToList();

        return new PagedResult<VehicleBrandDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<VehicleBrandDto?> GetByIdAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return null;

        return new VehicleBrandDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Country = entity.Country,
            Logo = entity.Logo,
            Description = entity.Description,
            Status = entity.Status
        };
    }

    public async Task<VehicleBrandDto> CreateAsync(CreateVehicleBrandRequest request)
    {
        if (await _context.VehicleBrands.AnyAsync(v => v.Code == request.Code && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Mã '{request.Code}' đã tồn tại");
        }

        var entity = new VehicleBrand
        {
            Code = request.Code,
            Name = request.Name,
            Country = request.Country,
            Logo = request.Logo,
            Description = request.Description,
            Status = request.Status,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        return new VehicleBrandDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Country = entity.Country,
            Logo = entity.Logo,
            Description = entity.Description,
            Status = entity.Status
        };
    }

    public async Task<VehicleBrandDto> UpdateAsync(int id, UpdateVehicleBrandRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hãng xe với ID {id}");
        }

        entity.Name = request.Name;
        entity.Country = request.Country;
        entity.Logo = request.Logo;
        entity.Description = request.Description;
        entity.Status = request.Status;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        return new VehicleBrandDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Country = entity.Country,
            Logo = entity.Logo,
            Description = entity.Description,
            Status = entity.Status
        };
    }

    public async Task DeleteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<VehicleBrandDto> CopyAsync(int id)
    {
        var source = await _repository.GetByIdAsync(id);
        if (source == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hãng xe với ID {id}");
        }

        var baseCode = source.Code;
        var newCode = baseCode;
        var counter = 1;
        while (await _context.VehicleBrands.AnyAsync(v => v.Code == newCode && !v.IsDeleted))
        {
            newCode = $"{baseCode}_{counter}";
            counter++;
        }

        var newEntity = new VehicleBrand
        {
            Code = newCode,
            Name = $"{source.Name} (Copy)",
            Country = source.Country,
            Logo = source.Logo,
            Description = source.Description,
            Status = DriveNow.Common.Constants.StatusConstants.Active,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(newEntity);

        return new VehicleBrandDto
        {
            Id = newEntity.Id,
            Code = newEntity.Code,
            Name = newEntity.Name,
            Country = newEntity.Country,
            Logo = newEntity.Logo,
            Description = newEntity.Description,
            Status = newEntity.Status
        };
    }
}

