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

public class VehicleColorService : IVehicleColorService
{
    private readonly IRepository<VehicleColor> _repository;
    private readonly ApplicationDbContext _context;

    public VehicleColorService(IRepository<VehicleColor> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<VehicleColorDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.VehicleColors.Where(v => !v.IsDeleted);

        // Normalize search and filter terms
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

        // Apply basic filters that can be translated to SQL
        if (!string.IsNullOrWhiteSpace(request.FilterStatus))
        {
            var filterStatus = request.FilterStatus.Trim();
            query = query.Where(v => v.Status == filterStatus);
        }

        // Materialize query to apply diacritic-insensitive filters in memory
        var allItems = await query.ToListAsync();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(v =>
                v.Code.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.Name.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                (v.HexCode != null && v.HexCode.NormalizeForSearch().Contains(normalizedSearchTerm))
            ).ToList();
        }

        // Apply advanced filters
        if (!string.IsNullOrWhiteSpace(normalizedFilterCode))
        {
            allItems = allItems.Where(v => v.Code.NormalizeForSearch().Contains(normalizedFilterCode)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(normalizedFilterName))
        {
            allItems = allItems.Where(v => v.Name.NormalizeForSearch().Contains(normalizedFilterName)).ToList();
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
            .Select(v => new VehicleColorDto
            {
                Id = v.Id,
                Code = v.Code,
                Name = v.Name,
                HexCode = v.HexCode,
                Status = v.Status
            })
            .ToList();

        return new PagedResult<VehicleColorDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<VehicleColorDto?> GetByIdAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return null;

        return new VehicleColorDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            HexCode = entity.HexCode,
            Status = entity.Status
        };
    }

    public async Task<VehicleColorDto> CreateAsync(CreateVehicleColorRequest request)
    {
        if (await _context.VehicleColors.AnyAsync(v => v.Code == request.Code && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Mã '{request.Code}' đã tồn tại");
        }

        var entity = new VehicleColor
        {
            Code = request.Code,
            Name = request.Name,
            HexCode = request.HexCode,
            Status = request.Status,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        return new VehicleColorDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            HexCode = entity.HexCode,
            Status = entity.Status
        };
    }

    public async Task<VehicleColorDto> UpdateAsync(int id, UpdateVehicleColorRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy màu xe với ID {id}");
        }

        entity.Name = request.Name;
        entity.HexCode = request.HexCode;
        entity.Status = request.Status;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        return new VehicleColorDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            HexCode = entity.HexCode,
            Status = entity.Status
        };
    }

    public async Task DeleteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<VehicleColorDto> CopyAsync(int id)
    {
        var source = await _repository.GetByIdAsync(id);
        if (source == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy màu xe với ID {id}");
        }

        var baseCode = source.Code;
        var newCode = baseCode;
        var counter = 1;
        while (await _context.VehicleColors.AnyAsync(v => v.Code == newCode && !v.IsDeleted))
        {
            newCode = $"{baseCode}_{counter}";
            counter++;
        }

        var newEntity = new VehicleColor
        {
            Code = newCode,
            Name = $"{source.Name} (Copy)",
            HexCode = source.HexCode,
            Status = StatusConstants.Active,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(newEntity);

        return new VehicleColorDto
        {
            Id = newEntity.Id,
            Code = newEntity.Code,
            Name = newEntity.Name,
            HexCode = newEntity.HexCode,
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

        // Validate sheet name
        if (!ExcelImportHelper.ValidateSheetName(worksheet, ExcelSheetNames.VehicleColor))
        {
            response.Success = false;
            response.Message = $"Tên sheet không đúng. Yêu cầu: '{ExcelSheetNames.VehicleColor}'";
            errors.Add(new ImportError { Row = 0, Message = $"Tên sheet không đúng. Yêu cầu: '{ExcelSheetNames.VehicleColor}'" });
            response.Errors = errors;
            return response;
        }

        var rowCount = worksheet.Dimension.Rows;
        response.TotalRows = rowCount - 1;

        var headers = ExcelImportHelper.ReadHeaders(worksheet, 1);

        // Validate required columns
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

        // Get column indices
        int codeCol = ExcelImportHelper.GetColumnIndex(headers, "Mã", "Code");
        int nameCol = ExcelImportHelper.GetColumnIndex(headers, "Tên", "Name");
        int hexCodeCol = ExcelImportHelper.GetColumnIndex(headers, "Mã màu", "HexCode");
        int statusCol = ExcelImportHelper.GetColumnIndex(headers, "Trạng thái", "Status");

        var entitiesToAdd = new List<VehicleColor>();

        // Validate all rows first before inserting
        for (int row = 2; row <= rowCount; row++)
        {
            var codeValue = ExcelImportHelper.GetCellValue(worksheet, row, codeCol);
            var nameValue = ExcelImportHelper.GetCellValue(worksheet, row, nameCol);
            var hexCodeValue = hexCodeCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, hexCodeCol) : null;
            var statusValue = statusCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, statusCol) : null;

            // Validate required fields
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

            // Validate max length
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

            if (hexCodeValue != null)
            {
                var hexCodeLengthError = ExcelImportHelper.ValidateMaxLength(hexCodeValue, "Mã màu", 7);
                if (hexCodeLengthError != null)
                {
                    errors.Add(new ImportError { Row = row, Message = hexCodeLengthError, Field = "HexCode" });
                    continue;
                }
            }

            // Parse and validate status
            var (parsedStatus, statusError) = ExcelImportHelper.TryParseStatus(statusValue, "Trạng thái");
            if (statusError != null)
            {
                errors.Add(new ImportError { Row = row, Message = statusError, Field = "Status" });
                continue;
            }

            var code = codeValue?.ToString()?.Trim().ToUpper() ?? string.Empty;
            var name = nameValue?.ToString()?.Trim() ?? string.Empty;
            var hexCode = hexCodeValue?.ToString()?.Trim();
            var status = parsedStatus ?? StatusConstants.Active;

            // Check if code already exists in DB
            if (await _context.VehicleColors.AnyAsync(v => v.Code == code && !v.IsDeleted))
            {
                errors.Add(new ImportError { Row = row, Message = $"Mã '{code}' đã tồn tại", Field = "Code" });
                continue;
            }

            // Check for duplicate codes within the current import batch
            if (entitiesToAdd.Any(e => e.Code == code))
            {
                errors.Add(new ImportError { Row = row, Message = $"Mã '{code}' bị trùng trong file Excel", Field = "Code" });
                continue;
            }

            entitiesToAdd.Add(new VehicleColor
            {
                Code = code,
                Name = name,
                HexCode = hexCode,
                Status = status,
                CreatedDate = DateTime.UtcNow
            });
        }

        // If there are errors, don't import anything
        if (errors.Any())
        {
            response.Success = false;
            response.Errors = errors;
            response.Message = ExcelImportHelper.AggregateErrors(errors.Select(e => (e.Row, e.Message)).ToList());
            return response;
        }

        // Import all valid rows
        if (entitiesToAdd.Any())
        {
            await _context.VehicleColors.AddRangeAsync(entitiesToAdd);
            await _context.SaveChangesAsync();
            response.SuccessCount = entitiesToAdd.Count;
        }

        response.Success = true;
        response.Message = $"Import thành công {response.SuccessCount} dòng";
        return response;
    }

    public async Task<MemoryStream> ExportExcelAsync(List<int>? ids)
    {
        List<VehicleColor> data;
        if (ids == null || ids.Count == 0)
        {
            data = await _context.VehicleColors.Where(v => !v.IsDeleted).ToListAsync();
        }
        else
        {
            data = await _context.VehicleColors.Where(v => !v.IsDeleted && ids.Contains(v.Id)).ToListAsync();
        }

        var columnMapping = new Dictionary<string, string>
        {
            { "Code", "Mã" },
            { "Name", "Tên" },
            { "HexCode", "Mã màu" },
            { "Status", "Trạng thái" }
        };

        return await ExcelExportHelper.ExportToExcelAsync(
            data: data,
            columnMapping: columnMapping,
            sheetName: "Màu xe"
        );
    }

    public async Task DeleteMultipleAsync(List<int> ids)
    {
        if (ids == null || ids.Count == 0)
        {
            throw new ArgumentException("Danh sách ID không được rỗng");
        }

        var entities = await _context.VehicleColors
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

