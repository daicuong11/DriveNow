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

public class EmployeeService : IEmployeeService
{
    private readonly IRepository<Employee> _repository;
    private readonly ApplicationDbContext _context;

    public EmployeeService(IRepository<Employee> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<EmployeeDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.Employees.Where(v => !v.IsDeleted);

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
                v.FullName.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.Email.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.Phone.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                (v.Position != null && v.Position.NormalizeForSearch().Contains(normalizedSearchTerm)) ||
                (v.Department != null && v.Department.NormalizeForSearch().Contains(normalizedSearchTerm))
            ).ToList();
        }

        if (!string.IsNullOrWhiteSpace(normalizedFilterCode))
        {
            allItems = allItems.Where(v => v.Code.NormalizeForSearch().Contains(normalizedFilterCode)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(normalizedFilterName))
        {
            allItems = allItems.Where(v => v.FullName.NormalizeForSearch().Contains(normalizedFilterName)).ToList();
        }

        var sortedItems = request.SortBy?.ToLower() switch
        {
            "code" => request.SortDescending ? allItems.OrderByDescending(v => v.Code) : allItems.OrderBy(v => v.Code),
            "fullname" => request.SortDescending ? allItems.OrderByDescending(v => v.FullName) : allItems.OrderBy(v => v.FullName),
            _ => allItems.OrderBy(v => v.Code)
        };

        var totalCount = sortedItems.Count();
        var items = sortedItems
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(v => new EmployeeDto
            {
                Id = v.Id,
                Code = v.Code,
                FullName = v.FullName,
                Email = v.Email,
                Phone = v.Phone,
                Address = v.Address,
                Position = v.Position,
                Department = v.Department,
                HireDate = v.HireDate,
                Status = v.Status
            })
            .ToList();

        return new PagedResult<EmployeeDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<EmployeeDto?> GetByIdAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null) return null;

        return new EmployeeDto
        {
            Id = entity.Id,
            Code = entity.Code,
            FullName = entity.FullName,
            Email = entity.Email,
            Phone = entity.Phone,
            Address = entity.Address,
            Position = entity.Position,
            Department = entity.Department,
            HireDate = entity.HireDate,
            Status = entity.Status
        };
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeRequest request)
    {
        if (await _context.Employees.AnyAsync(v => v.Code == request.Code && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Mã '{request.Code}' đã tồn tại");
        }

        if (await _context.Employees.AnyAsync(v => v.Email == request.Email && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Email '{request.Email}' đã tồn tại");
        }

        var entity = new Employee
        {
            Code = request.Code,
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            Position = request.Position,
            Department = request.Department,
            HireDate = request.HireDate,
            Status = request.Status,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        return new EmployeeDto
        {
            Id = entity.Id,
            Code = entity.Code,
            FullName = entity.FullName,
            Email = entity.Email,
            Phone = entity.Phone,
            Address = entity.Address,
            Position = entity.Position,
            Department = entity.Department,
            HireDate = entity.HireDate,
            Status = entity.Status
        };
    }

    public async Task<EmployeeDto> UpdateAsync(int id, UpdateEmployeeRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy nhân viên với ID {id}");
        }

        if (await _context.Employees.AnyAsync(v => v.Email == request.Email && v.Id != id && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Email '{request.Email}' đã tồn tại");
        }

        entity.FullName = request.FullName;
        entity.Email = request.Email;
        entity.Phone = request.Phone;
        entity.Address = request.Address;
        entity.Position = request.Position;
        entity.Department = request.Department;
        entity.HireDate = request.HireDate;
        entity.Status = request.Status;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        return new EmployeeDto
        {
            Id = entity.Id,
            Code = entity.Code,
            FullName = entity.FullName,
            Email = entity.Email,
            Phone = entity.Phone,
            Address = entity.Address,
            Position = entity.Position,
            Department = entity.Department,
            HireDate = entity.HireDate,
            Status = entity.Status
        };
    }

    public async Task DeleteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<EmployeeDto> CopyAsync(int id)
    {
        var source = await _repository.GetByIdAsync(id);
        if (source == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy nhân viên với ID {id}");
        }

        var baseCode = source.Code;
        var newCode = baseCode;
        var counter = 1;
        while (await _context.Employees.AnyAsync(v => v.Code == newCode && !v.IsDeleted))
        {
            newCode = $"{baseCode}_{counter}";
            counter++;
        }

        var newEntity = new Employee
        {
            Code = newCode,
            FullName = $"{source.FullName} (Copy)",
            Email = $"{source.Email}_{counter}",
            Phone = source.Phone,
            Address = source.Address,
            Position = source.Position,
            Department = source.Department,
            HireDate = source.HireDate,
            Status = StatusConstants.Active,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(newEntity);

        return new EmployeeDto
        {
            Id = newEntity.Id,
            Code = newEntity.Code,
            FullName = newEntity.FullName,
            Email = newEntity.Email,
            Phone = newEntity.Phone,
            Address = newEntity.Address,
            Position = newEntity.Position,
            Department = newEntity.Department,
            HireDate = newEntity.HireDate,
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

        if (!ExcelImportHelper.ValidateSheetName(worksheet, ExcelSheetNames.Employee))
        {
            response.Success = false;
            response.Message = $"Tên sheet không đúng. Yêu cầu: '{ExcelSheetNames.Employee}'";
            errors.Add(new ImportError { Row = 0, Message = $"Tên sheet không đúng. Yêu cầu: '{ExcelSheetNames.Employee}'" });
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
        if (!headers.ContainsKey("Họ tên") && !headers.ContainsKey("FullName") && !headers.ContainsKey("họ tên") && !headers.ContainsKey("fullname"))
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Họ tên' hoặc 'FullName'", Field = "FullName" });
        }
        if (!headers.ContainsKey("Email") && !headers.ContainsKey("email"))
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Email'", Field = "Email" });
        }
        if (!headers.ContainsKey("Số điện thoại") && !headers.ContainsKey("Phone") && !headers.ContainsKey("số điện thoại") && !headers.ContainsKey("phone"))
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Số điện thoại' hoặc 'Phone'", Field = "Phone" });
        }

        if (errors.Any())
        {
            response.Success = false;
            response.Errors = errors;
            response.Message = ExcelImportHelper.AggregateErrors(errors.Select(e => (e.Row, e.Message)).ToList());
            return response;
        }

        int codeCol = ExcelImportHelper.GetColumnIndex(headers, "Mã", "Code");
        int fullNameCol = ExcelImportHelper.GetColumnIndex(headers, "Họ tên", "FullName");
        int emailCol = ExcelImportHelper.GetColumnIndex(headers, "Email", "email");
        int phoneCol = ExcelImportHelper.GetColumnIndex(headers, "Số điện thoại", "Phone");
        int addressCol = ExcelImportHelper.GetColumnIndex(headers, "Địa chỉ", "Address");
        int positionCol = ExcelImportHelper.GetColumnIndex(headers, "Chức vụ", "Position");
        int departmentCol = ExcelImportHelper.GetColumnIndex(headers, "Phòng ban", "Department");
        int hireDateCol = ExcelImportHelper.GetColumnIndex(headers, "Ngày vào làm", "HireDate");
        int statusCol = ExcelImportHelper.GetColumnIndex(headers, "Trạng thái", "Status");

        var entitiesToAdd = new List<Employee>();

        for (int row = 2; row <= rowCount; row++)
        {
            var codeValue = ExcelImportHelper.GetCellValue(worksheet, row, codeCol);
            var fullNameValue = ExcelImportHelper.GetCellValue(worksheet, row, fullNameCol);
            var emailValue = ExcelImportHelper.GetCellValue(worksheet, row, emailCol);
            var phoneValue = ExcelImportHelper.GetCellValue(worksheet, row, phoneCol);
            var addressValue = addressCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, addressCol) : null;
            var positionValue = positionCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, positionCol) : null;
            var departmentValue = departmentCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, departmentCol) : null;
            var hireDateValue = hireDateCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, hireDateCol) : null;
            var statusValue = statusCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, statusCol) : null;

            var codeError = ExcelImportHelper.ValidateRequired(codeValue, "Mã");
            if (codeError != null)
            {
                errors.Add(new ImportError { Row = row, Message = codeError, Field = "Code" });
                continue;
            }

            var fullNameError = ExcelImportHelper.ValidateRequired(fullNameValue, "Họ tên");
            if (fullNameError != null)
            {
                errors.Add(new ImportError { Row = row, Message = fullNameError, Field = "FullName" });
                continue;
            }

            var emailError = ExcelImportHelper.ValidateRequired(emailValue, "Email");
            if (emailError != null)
            {
                errors.Add(new ImportError { Row = row, Message = emailError, Field = "Email" });
                continue;
            }

            var phoneError = ExcelImportHelper.ValidateRequired(phoneValue, "Số điện thoại");
            if (phoneError != null)
            {
                errors.Add(new ImportError { Row = row, Message = phoneError, Field = "Phone" });
                continue;
            }

            var codeMaxLengthError = ExcelImportHelper.ValidateMaxLength(codeValue, "Mã", 50);
            if (codeMaxLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = codeMaxLengthError, Field = "Code" });
                continue;
            }

            var fullNameMaxLengthError = ExcelImportHelper.ValidateMaxLength(fullNameValue, "Họ tên", 200);
            if (fullNameMaxLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = fullNameMaxLengthError, Field = "FullName" });
                continue;
            }

            var emailMaxLengthError = ExcelImportHelper.ValidateMaxLength(emailValue, "Email", 200);
            if (emailMaxLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = emailMaxLengthError, Field = "Email" });
                continue;
            }

            var phoneMaxLengthError = ExcelImportHelper.ValidateMaxLength(phoneValue, "Số điện thoại", 20);
            if (phoneMaxLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = phoneMaxLengthError, Field = "Phone" });
                continue;
            }

            var (parsedHireDate, hireDateError) = ExcelImportHelper.TryParseDateTime(hireDateValue, "Ngày vào làm");
            if (hireDateError != null)
            {
                errors.Add(new ImportError { Row = row, Message = hireDateError, Field = "HireDate" });
                continue;
            }

            var (parsedStatus, statusError) = ExcelImportHelper.TryParseStatus(statusValue, "Trạng thái");
            if (statusError != null)
            {
                errors.Add(new ImportError { Row = row, Message = statusError, Field = "Status" });
                continue;
            }

            var code = codeValue?.ToString()?.Trim().ToUpper() ?? string.Empty;
            var fullName = fullNameValue?.ToString()?.Trim() ?? string.Empty;
            var email = emailValue?.ToString()?.Trim() ?? string.Empty;
            var phone = phoneValue?.ToString()?.Trim() ?? string.Empty;
            var address = addressValue?.ToString()?.Trim();
            var position = positionValue?.ToString()?.Trim();
            var department = departmentValue?.ToString()?.Trim();
            var hireDate = parsedHireDate;
            var status = parsedStatus ?? StatusConstants.Active;

            if (await _context.Employees.AnyAsync(v => v.Code == code && !v.IsDeleted))
            {
                errors.Add(new ImportError { Row = row, Message = $"Mã '{code}' đã tồn tại", Field = "Code" });
                continue;
            }

            if (await _context.Employees.AnyAsync(v => v.Email == email && !v.IsDeleted))
            {
                errors.Add(new ImportError { Row = row, Message = $"Email '{email}' đã tồn tại", Field = "Email" });
                continue;
            }

            if (entitiesToAdd.Any(e => e.Code == code))
            {
                errors.Add(new ImportError { Row = row, Message = $"Mã '{code}' bị trùng trong file Excel", Field = "Code" });
                continue;
            }

            if (entitiesToAdd.Any(e => e.Email == email))
            {
                errors.Add(new ImportError { Row = row, Message = $"Email '{email}' bị trùng trong file Excel", Field = "Email" });
                continue;
            }

            entitiesToAdd.Add(new Employee
            {
                Code = code,
                FullName = fullName,
                Email = email,
                Phone = phone,
                Address = address,
                Position = position,
                Department = department,
                HireDate = hireDate,
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
            await _context.Employees.AddRangeAsync(entitiesToAdd);
            await _context.SaveChangesAsync();
            response.SuccessCount = entitiesToAdd.Count;
        }

        response.Success = true;
        response.Message = $"Import thành công {response.SuccessCount} dòng";
        return response;
    }

    public async Task<MemoryStream> ExportExcelAsync(List<int>? ids)
    {
        List<Employee> data;
        if (ids == null || ids.Count == 0)
        {
            data = await _context.Employees.Where(v => !v.IsDeleted).ToListAsync();
        }
        else
        {
            data = await _context.Employees.Where(v => !v.IsDeleted && ids.Contains(v.Id)).ToListAsync();
        }

        var columnMapping = new Dictionary<string, string>
        {
            { "Code", "Mã" },
            { "FullName", "Họ tên" },
            { "Email", "Email" },
            { "Phone", "Số điện thoại" },
            { "Address", "Địa chỉ" },
            { "Position", "Chức vụ" },
            { "Department", "Phòng ban" },
            { "HireDate", "Ngày vào làm" },
            { "Status", "Trạng thái" }
        };

        return await ExcelExportHelper.ExportToExcelAsync(
            data: data,
            columnMapping: columnMapping,
            sheetName: "Nhân viên"
        );
    }

    public async Task DeleteMultipleAsync(List<int> ids)
    {
        if (ids == null || ids.Count == 0)
        {
            throw new ArgumentException("Danh sách ID không được rỗng");
        }

        var entities = await _context.Employees
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

