using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.MasterData;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Data.Interfaces;
using DriveNow.Common.Constants;
using DriveNow.Common.Extensions;
using DriveNow.Common.Helpers;
using OfficeOpenXml;

namespace DriveNow.Business.Services;

public class SystemConfigService : ISystemConfigService
{
    private readonly IRepository<SystemConfig> _repository;
    private readonly ApplicationDbContext _context;

    public SystemConfigService(IRepository<SystemConfig> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<SystemConfigDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.SystemConfigs.Where(v => !v.IsDeleted);

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

        if (!string.IsNullOrWhiteSpace(request.FilterStatus))
        {
            var filterStatus = request.FilterStatus.Trim();
            query = query.Where(v => v.Status == filterStatus);
        }

        var allItems = await query.ToListAsync();

        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(v =>
                v.Code.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.Name.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                (v.Description != null && v.Description.NormalizeForSearch().Contains(normalizedSearchTerm)) ||
                (v.Category != null && v.Category.NormalizeForSearch().Contains(normalizedSearchTerm))
            ).ToList();
        }

        if (!string.IsNullOrWhiteSpace(normalizedFilterCode))
        {
            allItems = allItems.Where(v => v.Code.NormalizeForSearch().Contains(normalizedFilterCode)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(normalizedFilterName))
        {
            allItems = allItems.Where(v => v.Name.NormalizeForSearch().Contains(normalizedFilterName)).ToList();
        }

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
            .Select(v => new SystemConfigDto
            {
                Id = v.Id,
                Code = v.Code,
                Name = v.Name,
                Value = v.Value,
                Description = v.Description,
                Category = v.Category,
                Status = v.Status
            })
            .ToList();

        return new PagedResult<SystemConfigDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<SystemConfigDto?> GetByIdAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return null;

        return new SystemConfigDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Value = entity.Value,
            Description = entity.Description,
            Category = entity.Category,
            Status = entity.Status
        };
    }

    public async Task<SystemConfigDto> CreateAsync(CreateSystemConfigRequest request)
    {
        if (await _context.SystemConfigs.AnyAsync(v => v.Code == request.Code && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Mã '{request.Code}' đã tồn tại");
        }

        var entity = new SystemConfig
        {
            Code = request.Code,
            Name = request.Name,
            Value = request.Value,
            Description = request.Description,
            Category = request.Category,
            Status = request.Status,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        return new SystemConfigDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Value = entity.Value,
            Description = entity.Description,
            Category = entity.Category,
            Status = entity.Status
        };
    }

    public async Task<SystemConfigDto> UpdateAsync(int id, UpdateSystemConfigRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy cấu hình hệ thống với ID {id}");
        }

        entity.Name = request.Name;
        entity.Value = request.Value;
        entity.Description = request.Description;
        entity.Category = request.Category;
        entity.Status = request.Status;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        return new SystemConfigDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Value = entity.Value,
            Description = entity.Description,
            Category = entity.Category,
            Status = entity.Status
        };
    }

    public async Task DeleteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<SystemConfigDto> CopyAsync(int id)
    {
        var source = await _repository.GetByIdAsync(id);
        if (source == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy cấu hình hệ thống với ID {id}");
        }

        var baseCode = source.Code;
        var newCode = baseCode;
        var counter = 1;
        while (await _context.SystemConfigs.AnyAsync(v => v.Code == newCode && !v.IsDeleted))
        {
            newCode = $"{baseCode}_{counter}";
            counter++;
        }

        var newEntity = new SystemConfig
        {
            Code = newCode,
            Name = $"{source.Name} (Copy)",
            Value = source.Value,
            Description = source.Description,
            Category = source.Category,
            Status = StatusConstants.Active,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(newEntity);

        return new SystemConfigDto
        {
            Id = newEntity.Id,
            Code = newEntity.Code,
            Name = newEntity.Name,
            Value = newEntity.Value,
            Description = newEntity.Description,
            Category = newEntity.Category,
            Status = newEntity.Status
        };
    }

    public async Task<ImportExcelResponse> ImportExcelAsync(Stream fileStream, string fileName)
    {
        var response = new ImportExcelResponse();
        var errors = new List<ImportError>();

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        using var package = new ExcelPackage(fileStream);
        
        if (package.Workbook.Worksheets.Count == 0)
        {
            response.Success = false;
            response.Message = "File Excel không có sheet nào";
            errors.Add(new ImportError { Row = 0, Message = "File Excel không có sheet nào" });
            response.Errors = errors;
            return response;
        }

        var worksheet = package.Workbook.Worksheets[0];

        if (worksheet == null || worksheet.Dimension == null)
        {
            response.Success = false;
            response.Message = "File Excel không hợp lệ hoặc rỗng";
            errors.Add(new ImportError { Row = 0, Message = "File Excel không hợp lệ hoặc rỗng" });
            response.Errors = errors;
            return response;
        }

        if (!ExcelImportHelper.ValidateSheetName(worksheet, ExcelSheetNames.SystemConfig))
        {
            response.Success = false;
            response.Message = $"Tên sheet không đúng. Yêu cầu: '{ExcelSheetNames.SystemConfig}'";
            errors.Add(new ImportError { Row = 0, Message = $"Tên sheet không đúng. Yêu cầu: '{ExcelSheetNames.SystemConfig}'" });
            response.Errors = errors;
            return response;
        }

        var rowCount = worksheet.Dimension.Rows;
        response.TotalRows = rowCount - 1;

        var headers = ExcelImportHelper.ReadHeaders(worksheet, 1);

        if (!headers.ContainsKey("Mã") && !headers.ContainsKey("Code") && !headers.ContainsKey("mã") && !headers.ContainsKey("code"))
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Mã' hoặc 'Code'", Field = "Code" });
        }
        if (!headers.ContainsKey("Tên") && !headers.ContainsKey("Name") && !headers.ContainsKey("tên") && !headers.ContainsKey("name"))
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Tên' hoặc 'Name'", Field = "Name" });
        }

        if (errors.Any())
        {
            response.Success = false;
            response.Errors = errors;
            response.Message = ExcelImportHelper.AggregateErrors(errors.Select(e => (e.Row, e.Message)).ToList());
            return response;
        }

        int codeCol = ExcelImportHelper.GetColumnIndex(headers, "Mã", "Code");
        int nameCol = ExcelImportHelper.GetColumnIndex(headers, "Tên", "Name");
        int valueCol = ExcelImportHelper.GetColumnIndex(headers, "Giá trị", "Value");
        int descCol = ExcelImportHelper.GetColumnIndex(headers, "Mô tả", "Description");
        int categoryCol = ExcelImportHelper.GetColumnIndex(headers, "Nhóm", "Category");
        int statusCol = ExcelImportHelper.GetColumnIndex(headers, "Trạng thái", "Status");

        var entitiesToAdd = new List<SystemConfig>();

        for (int row = 2; row <= rowCount; row++)
        {
            var codeValue = ExcelImportHelper.GetCellValue(worksheet, row, codeCol);
            var nameValue = ExcelImportHelper.GetCellValue(worksheet, row, nameCol);
            var valueValue = valueCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, valueCol) : null;
            var descValue = descCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, descCol) : null;
            var categoryValue = categoryCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, categoryCol) : null;
            var statusValue = statusCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, statusCol) : null;

            var codeError = ExcelImportHelper.ValidateRequired(codeValue, "Mã");
            if (codeError != null)
            {
                errors.Add(new ImportError { Row = row, Message = codeError, Field = "Code" });
                continue;
            }

            var nameError = ExcelImportHelper.ValidateRequired(nameValue, "Tên");
            if (nameError != null)
            {
                errors.Add(new ImportError { Row = row, Message = nameError, Field = "Name" });
                continue;
            }

            var codeMaxLengthError = ExcelImportHelper.ValidateMaxLength(codeValue, "Mã", 50);
            if (codeMaxLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = codeMaxLengthError, Field = "Code" });
                continue;
            }

            var nameMaxLengthError = ExcelImportHelper.ValidateMaxLength(nameValue, "Tên", 200);
            if (nameMaxLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = nameMaxLengthError, Field = "Name" });
                continue;
            }

            if (valueValue != null)
            {
                var valueMaxLengthError = ExcelImportHelper.ValidateMaxLength(valueValue, "Giá trị", 1000);
                if (valueMaxLengthError != null)
                {
                    errors.Add(new ImportError { Row = row, Message = valueMaxLengthError, Field = "Value" });
                    continue;
                }
            }

            if (descValue != null)
            {
                var descMaxLengthError = ExcelImportHelper.ValidateMaxLength(descValue, "Mô tả", 500);
                if (descMaxLengthError != null)
                {
                    errors.Add(new ImportError { Row = row, Message = descMaxLengthError, Field = "Description" });
                    continue;
                }
            }

            if (categoryValue != null)
            {
                var categoryMaxLengthError = ExcelImportHelper.ValidateMaxLength(categoryValue, "Nhóm", 100);
                if (categoryMaxLengthError != null)
                {
                    errors.Add(new ImportError { Row = row, Message = categoryMaxLengthError, Field = "Category" });
                    continue;
                }
            }

            var (parsedStatus, statusError) = ExcelImportHelper.TryParseStatus(statusValue, "Trạng thái");
            if (statusError != null)
            {
                errors.Add(new ImportError { Row = row, Message = statusError, Field = "Status" });
                continue;
            }

            var code = codeValue?.ToString()?.Trim().ToUpper() ?? string.Empty;
            var name = nameValue?.ToString()?.Trim() ?? string.Empty;
            var value = valueValue?.ToString()?.Trim();
            var description = descValue?.ToString()?.Trim();
            var category = categoryValue?.ToString()?.Trim();
            var status = parsedStatus ?? StatusConstants.Active;

            if (await _context.SystemConfigs.AnyAsync(v => v.Code == code && !v.IsDeleted))
            {
                errors.Add(new ImportError { Row = row, Message = $"Mã '{code}' đã tồn tại", Field = "Code" });
                continue;
            }

            if (entitiesToAdd.Any(e => e.Code == code))
            {
                errors.Add(new ImportError { Row = row, Message = $"Mã '{code}' bị trùng trong file Excel", Field = "Code" });
                continue;
            }

            entitiesToAdd.Add(new SystemConfig
            {
                Code = code,
                Name = name,
                Value = value,
                Description = description,
                Category = category,
                Status = status,
                CreatedDate = DateTime.UtcNow
            });
        }

        if (errors.Any())
        {
            response.Success = false;
            response.Errors = errors;
            response.Message = ExcelImportHelper.AggregateErrors(errors.Select(e => (e.Row, e.Message)).ToList());
            return response;
        }

        if (entitiesToAdd.Any())
        {
            await _context.SystemConfigs.AddRangeAsync(entitiesToAdd);
            await _context.SaveChangesAsync();
            response.SuccessCount = entitiesToAdd.Count;
        }

        response.Success = true;
        response.Message = $"Import thành công {response.SuccessCount} dòng";
        return response;
    }

    public async Task<MemoryStream> ExportExcelAsync(List<int>? ids)
    {
        List<SystemConfig> data;
        if (ids == null || ids.Count == 0)
        {
            data = await _context.SystemConfigs.Where(v => !v.IsDeleted).ToListAsync();
        }
        else
        {
            data = await _context.SystemConfigs.Where(v => !v.IsDeleted && ids.Contains(v.Id)).ToListAsync();
        }

        var columnMapping = new Dictionary<string, string>
        {
            { "Code", "Mã" },
            { "Name", "Tên" },
            { "Value", "Giá trị" },
            { "Description", "Mô tả" },
            { "Category", "Nhóm" },
            { "Status", "Trạng thái" }
        };

        return await ExcelExportHelper.ExportToExcelAsync(
            data: data,
            columnMapping: columnMapping,
            sheetName: "Cấu hình hệ thống"
        );
    }

    public async Task DeleteMultipleAsync(List<int> ids)
    {
        if (ids == null || ids.Count == 0)
        {
            throw new ArgumentException("Danh sách ID không được rỗng");
        }

        var entities = await _context.SystemConfigs
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

