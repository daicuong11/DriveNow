using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Data.Interfaces;
using DriveNow.Common.Constants;
using DriveNow.Common.Extensions;
using OfficeOpenXml;

namespace DriveNow.Business.Services;

public class VehicleTypeService : IVehicleTypeService
{
    private readonly IRepository<VehicleType> _repository;
    private readonly ApplicationDbContext _context;

    public VehicleTypeService(IRepository<VehicleType> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<VehicleTypeDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.VehicleTypes.Where(v => !v.IsDeleted);

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
            .Select(v => new VehicleTypeDto
            {
                Id = v.Id,
                Code = v.Code,
                Name = v.Name,
                Description = v.Description,
                Status = v.Status
            })
            .ToList();

        return new PagedResult<VehicleTypeDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<VehicleTypeDto?> GetByIdAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return null;

        return new VehicleTypeDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Description = entity.Description,
            Status = entity.Status
        };
    }

    public async Task<VehicleTypeDto> CreateAsync(CreateVehicleTypeRequest request)
    {
        // Check if code exists
        if (await _context.VehicleTypes.AnyAsync(v => v.Code == request.Code && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Mã '{request.Code}' đã tồn tại");
        }

        var entity = new VehicleType
        {
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        return new VehicleTypeDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Description = entity.Description,
            Status = entity.Status
        };
    }

    public async Task<VehicleTypeDto> UpdateAsync(int id, UpdateVehicleTypeRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy loại xe với ID {id}");
        }

        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.Status = request.Status;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        return new VehicleTypeDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Description = entity.Description,
            Status = entity.Status
        };
    }

    public async Task DeleteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<VehicleTypeDto> CopyAsync(int id)
    {
        var source = await _repository.GetByIdAsync(id);
        if (source == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy loại xe với ID {id}");
        }

        // Generate new code
        var baseCode = source.Code;
        var newCode = baseCode;
        var counter = 1;
        while (await _context.VehicleTypes.AnyAsync(v => v.Code == newCode && !v.IsDeleted))
        {
            newCode = $"{baseCode}_{counter}";
            counter++;
        }

        var newEntity = new VehicleType
        {
            Code = newCode,
            Name = $"{source.Name} (Copy)",
            Description = source.Description,
            Status = StatusConstants.Active,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(newEntity);

        return new VehicleTypeDto
        {
            Id = newEntity.Id,
            Code = newEntity.Code,
            Name = newEntity.Name,
            Description = newEntity.Description,
            Status = newEntity.Status
        };
    }

    public async Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName)
    {
        var response = new ImportExcelResponse();
        var errors = new List<ImportError>();

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        using var package = new ExcelPackage(fileStream);
        var worksheet = package.Workbook.Worksheets[0];

        if (worksheet == null || worksheet.Dimension == null)
        {
            response.Success = false;
            response.Message = "File Excel không hợp lệ hoặc rỗng";
            return response;
        }

        var rowCount = worksheet.Dimension.Rows;
        response.TotalRows = rowCount - 1; // Exclude header row

        // Validate header row (row 1)
        var headers = new Dictionary<string, int>();
        for (int col = 1; col <= worksheet.Dimension.Columns; col++)
        {
            var headerValue = worksheet.Cells[1, col].Value?.ToString()?.Trim();
            if (!string.IsNullOrWhiteSpace(headerValue))
            {
                headers[headerValue.ToLower()] = col;
            }
        }

        // Required columns
        if (!headers.ContainsKey("mã") && !headers.ContainsKey("code"))
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Mã' hoặc 'Code'", Field = "Code" });
        }
        if (!headers.ContainsKey("tên") && !headers.ContainsKey("name"))
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Tên' hoặc 'Name'", Field = "Name" });
        }

        if (errors.Any())
        {
            response.Success = false;
            response.Errors = errors;
            response.Message = "File Excel không đúng định dạng";
            return response;
        }

        // Get column indices
        var codeCol = headers.ContainsKey("mã") ? headers["mã"] : headers["code"];
        var nameCol = headers.ContainsKey("tên") ? headers["tên"] : headers["name"];
        var descCol = headers.ContainsKey("mô tả") ? headers["mô tả"] : (headers.ContainsKey("description") ? headers["description"] : -1);
        var statusCol = headers.ContainsKey("trạng thái") ? headers["trạng thái"] : (headers.ContainsKey("status") ? headers["status"] : -1);

        var entitiesToAdd = new List<VehicleType>();

        // Process data rows (starting from row 2)
        for (int row = 2; row <= rowCount; row++)
        {
            var code = worksheet.Cells[row, codeCol].Value?.ToString()?.Trim().ToUpper();
            var name = worksheet.Cells[row, nameCol].Value?.ToString()?.Trim();
            var description = descCol > 0 ? worksheet.Cells[row, descCol].Value?.ToString()?.Trim() : null;
            var status = statusCol > 0 ? worksheet.Cells[row, statusCol].Value?.ToString()?.Trim().ToUpper() : "A";

            // Validate row
            if (string.IsNullOrWhiteSpace(code))
            {
                errors.Add(new ImportError { Row = row, Message = "Mã không được để trống", Field = "Code" });
                continue;
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                errors.Add(new ImportError { Row = row, Message = "Tên không được để trống", Field = "Name" });
                continue;
            }

            if (status != "A" && status != "I")
            {
                status = "A"; // Default to Active
            }

            // Check if code already exists
            if (await _context.VehicleTypes.AnyAsync(v => v.Code == code && !v.IsDeleted))
            {
                errors.Add(new ImportError { Row = row, Message = $"Mã '{code}' đã tồn tại", Field = "Code" });
                continue;
            }

            entitiesToAdd.Add(new VehicleType
            {
                Code = code,
                Name = name,
                Description = description,
                Status = status,
                CreatedDate = DateTime.UtcNow
            });
        }

        // If there are errors, don't import anything
        if (errors.Any())
        {
            response.Success = false;
            response.Errors = errors;
            response.Message = $"Có {errors.Count} lỗi trong file Excel. Vui lòng kiểm tra và sửa lại.";
            return response;
        }

        // Import all valid rows
        if (entitiesToAdd.Any())
        {
            await _context.VehicleTypes.AddRangeAsync(entitiesToAdd);
            await _context.SaveChangesAsync();
            response.SuccessCount = entitiesToAdd.Count;
        }

        response.Success = true;
        response.Message = $"Import thành công {response.SuccessCount} dòng";
        return response;
    }

    public async Task<MemoryStream> ExportExcelAsync(List<int>? ids)
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        List<VehicleType> data;
        if (ids == null || ids.Count == 0)
        {
            // Export all
            data = await _context.VehicleTypes.Where(v => !v.IsDeleted).ToListAsync();
        }
        else
        {
            // Export selected
            data = await _context.VehicleTypes.Where(v => !v.IsDeleted && ids.Contains(v.Id)).ToListAsync();
        }

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Loại xe");

        // Headers
        worksheet.Cells[1, 1].Value = "Mã";
        worksheet.Cells[1, 2].Value = "Tên";
        worksheet.Cells[1, 3].Value = "Mô tả";
        worksheet.Cells[1, 4].Value = "Trạng thái";

        // Style headers
        using (var range = worksheet.Cells[1, 1, 1, 4])
        {
            range.Style.Font.Bold = true;
            range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
        }

        // Data
        for (int i = 0; i < data.Count; i++)
        {
            var row = i + 2;
            worksheet.Cells[row, 1].Value = data[i].Code;
            worksheet.Cells[row, 2].Value = data[i].Name;
            worksheet.Cells[row, 3].Value = data[i].Description;
            worksheet.Cells[row, 4].Value = data[i].Status == "A" ? "Hoạt động" : "Không hoạt động";
        }

        // Auto-fit columns
        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

        var memoryStream = new MemoryStream();
        await package.SaveAsAsync(memoryStream);
        memoryStream.Position = 0;
        return memoryStream;
    }

    public async Task DeleteMultipleAsync(List<int> ids)
    {
        if (ids == null || ids.Count == 0)
        {
            throw new ArgumentException("Danh sách ID không được rỗng");
        }

        var entities = await _context.VehicleTypes
            .Where(v => ids.Contains(v.Id) && !v.IsDeleted)
            .ToListAsync();

        foreach (var entity in entities)
        {
            entity.IsDeleted = true;
            entity.ModifiedDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}

