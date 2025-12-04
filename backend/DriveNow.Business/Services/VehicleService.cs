using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Vehicle;
using DriveNow.Business.DTOs.MasterData;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Data.Interfaces;
using DriveNow.Common.Constants;
using DriveNow.Common.Extensions;
using DriveNow.Common.Helpers;
using OfficeOpenXml;
using static DriveNow.Common.Constants.ExcelSheetNames;
using VehicleStatus = DriveNow.Common.Constants.VehicleStatusConstants;
using VehicleHistoryAction = DriveNow.Common.Constants.VehicleHistoryActionTypeConstants;

namespace DriveNow.Business.Services;

public class VehicleService : IVehicleService
{
    private readonly IRepository<Vehicle> _repository;
    private readonly ApplicationDbContext _context;

    public VehicleService(IRepository<Vehicle> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<VehicleDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.VehicleBrand)
            .Include(v => v.VehicleColor)
            .Where(v => !v.IsDeleted);

        // Normalize search and filter terms
        string? normalizedSearchTerm = null;
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            normalizedSearchTerm = request.SearchTerm.Trim().NormalizeForSearch();
        }

        // Apply basic filters that can be translated to SQL
        if (!string.IsNullOrWhiteSpace(request.FilterStatus))
        {
            query = query.Where(v => v.Status == request.FilterStatus.Trim());
        }

        if (request.FilterVehicleTypeId.HasValue)
        {
            query = query.Where(v => v.VehicleTypeId == request.FilterVehicleTypeId.Value);
        }

        if (request.FilterVehicleBrandId.HasValue)
        {
            query = query.Where(v => v.VehicleBrandId == request.FilterVehicleBrandId.Value);
        }

        // Materialize to apply diacritic-insensitive filters
        var allItems = await query.ToListAsync();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(v =>
                v.Code.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.LicensePlate.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.Model.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.VehicleType.Name.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                v.VehicleBrand.Name.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                (v.Description != null && v.Description.NormalizeForSearch().Contains(normalizedSearchTerm))
            ).ToList();
        }

        // Apply advanced filters
        if (!string.IsNullOrWhiteSpace(request.FilterCode))
        {
            var normalizedFilterCode = request.FilterCode.Trim().NormalizeForSearch();
            allItems = allItems.Where(v => v.Code.NormalizeForSearch().Contains(normalizedFilterCode)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(request.FilterName))
        {
            var normalizedFilterName = request.FilterName.Trim().NormalizeForSearch();
            allItems = allItems.Where(v => v.Model.NormalizeForSearch().Contains(normalizedFilterName)).ToList();
        }

        // Sort
        var sortedItems = request.SortBy?.ToLower() switch
        {
            "code" => request.SortDescending ? allItems.OrderByDescending(v => v.Code) : allItems.OrderBy(v => v.Code),
            "licenseplate" => request.SortDescending ? allItems.OrderByDescending(v => v.LicensePlate) : allItems.OrderBy(v => v.LicensePlate),
            "model" => request.SortDescending ? allItems.OrderByDescending(v => v.Model) : allItems.OrderBy(v => v.Model),
            "year" => request.SortDescending ? allItems.OrderByDescending(v => v.Year) : allItems.OrderBy(v => v.Year),
            "status" => request.SortDescending ? allItems.OrderByDescending(v => v.Status) : allItems.OrderBy(v => v.Status),
            "dailyrentalprice" => request.SortDescending ? allItems.OrderByDescending(v => v.DailyRentalPrice) : allItems.OrderBy(v => v.DailyRentalPrice),
            _ => allItems.OrderBy(v => v.Code)
        };

        var totalCount = sortedItems.Count();
        var items = sortedItems
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(v => new VehicleDto
            {
                Id = v.Id,
                Code = v.Code,
                VehicleTypeId = v.VehicleTypeId,
                VehicleTypeName = v.VehicleType.Name,
                VehicleBrandId = v.VehicleBrandId,
                VehicleBrandName = v.VehicleBrand.Name,
                VehicleColorId = v.VehicleColorId,
                VehicleColorName = v.VehicleColor.Name,
                Model = v.Model,
                Year = v.Year,
                SeatCount = v.SeatCount,
                FuelType = v.FuelType,
                LicensePlate = v.LicensePlate,
                ChassisNumber = v.ChassisNumber,
                EngineNumber = v.EngineNumber,
                RegistrationDate = v.RegistrationDate,
                InsuranceExpiryDate = v.InsuranceExpiryDate,
                Status = v.Status,
                CurrentLocation = v.CurrentLocation,
                DailyRentalPrice = v.DailyRentalPrice,
                ImageUrl = v.ImageUrl,
                Description = v.Description,
                CreatedDate = v.CreatedDate,
                CreatedBy = v.CreatedBy,
                ModifiedDate = v.ModifiedDate,
                ModifiedBy = v.ModifiedBy
            })
            .ToList();

        return new PagedResult<VehicleDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<VehicleDto?> GetByIdAsync(int id)
    {
        var entity = await _context.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.VehicleBrand)
            .Include(v => v.VehicleColor)
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);

        if (entity == null) return null;

        return new VehicleDto
        {
            Id = entity.Id,
            Code = entity.Code,
            VehicleTypeId = entity.VehicleTypeId,
            VehicleTypeName = entity.VehicleType.Name,
            VehicleBrandId = entity.VehicleBrandId,
            VehicleBrandName = entity.VehicleBrand.Name,
            VehicleColorId = entity.VehicleColorId,
            VehicleColorName = entity.VehicleColor.Name,
            Model = entity.Model,
            Year = entity.Year,
            SeatCount = entity.SeatCount,
            FuelType = entity.FuelType,
            LicensePlate = entity.LicensePlate,
            ChassisNumber = entity.ChassisNumber,
            EngineNumber = entity.EngineNumber,
            RegistrationDate = entity.RegistrationDate,
            InsuranceExpiryDate = entity.InsuranceExpiryDate,
            Status = entity.Status,
            CurrentLocation = entity.CurrentLocation,
            DailyRentalPrice = entity.DailyRentalPrice,
            ImageUrl = entity.ImageUrl,
            Description = entity.Description,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            ModifiedDate = entity.ModifiedDate,
            ModifiedBy = entity.ModifiedBy
        };
    }

    public async Task<VehicleDto> CreateAsync(CreateVehicleRequest request)
    {
        // Check if Code exists
        if (await _context.Vehicles.AnyAsync(v => v.Code == request.Code && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Biển số xe '{request.Code}' đã tồn tại");
        }

        // Check if LicensePlate exists
        if (await _context.Vehicles.AnyAsync(v => v.LicensePlate == request.LicensePlate && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Biển số đăng ký '{request.LicensePlate}' đã tồn tại");
        }

        // Check if ChassisNumber exists (if provided)
        if (!string.IsNullOrWhiteSpace(request.ChassisNumber) &&
            await _context.Vehicles.AnyAsync(v => v.ChassisNumber == request.ChassisNumber && !v.IsDeleted))
        {
            throw new InvalidOperationException($"Số khung '{request.ChassisNumber}' đã tồn tại");
        }

        var entity = new Vehicle
        {
            Code = request.Code.Trim().ToUpper(),
            VehicleTypeId = request.VehicleTypeId,
            VehicleBrandId = request.VehicleBrandId,
            VehicleColorId = request.VehicleColorId,
            Model = request.Model.Trim(),
            Year = request.Year,
            SeatCount = request.SeatCount,
            FuelType = request.FuelType.Trim(),
            LicensePlate = request.LicensePlate.Trim().ToUpper(),
            ChassisNumber = request.ChassisNumber?.Trim().ToUpper(),
            EngineNumber = request.EngineNumber?.Trim().ToUpper(),
            RegistrationDate = request.RegistrationDate,
            InsuranceExpiryDate = request.InsuranceExpiryDate,
            Status = request.Status,
            CurrentLocation = request.CurrentLocation?.Trim(),
            DailyRentalPrice = request.DailyRentalPrice,
            ImageUrl = request.ImageUrl?.Trim(),
            Description = request.Description?.Trim(),
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        // Create history record
        await CreateHistoryAsync(entity.Id, VehicleHistoryAction.Created, null, entity.Status, "Tạo mới xe");

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin xe sau khi tạo");
    }

    public async Task<VehicleDto> UpdateAsync(int id, UpdateVehicleRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy xe với ID {id}");
        }

        var oldStatus = entity.Status;

        // Check if LicensePlate exists (if changed)
        if (request.LicensePlate != entity.LicensePlate &&
            await _context.Vehicles.AnyAsync(v => v.LicensePlate == request.LicensePlate && !v.IsDeleted && v.Id != id))
        {
            throw new InvalidOperationException($"Biển số đăng ký '{request.LicensePlate}' đã tồn tại");
        }

        // Check if ChassisNumber exists (if changed and provided)
        if (!string.IsNullOrWhiteSpace(request.ChassisNumber) &&
            request.ChassisNumber != entity.ChassisNumber &&
            await _context.Vehicles.AnyAsync(v => v.ChassisNumber == request.ChassisNumber && !v.IsDeleted && v.Id != id))
        {
            throw new InvalidOperationException($"Số khung '{request.ChassisNumber}' đã tồn tại");
        }

        // Update properties (Code cannot be updated)
        entity.VehicleTypeId = request.VehicleTypeId;
        entity.VehicleBrandId = request.VehicleBrandId;
        entity.VehicleColorId = request.VehicleColorId;
        entity.Model = request.Model.Trim();
        entity.Year = request.Year;
        entity.SeatCount = request.SeatCount;
        entity.FuelType = request.FuelType.Trim();
        entity.LicensePlate = request.LicensePlate.Trim().ToUpper();
        entity.ChassisNumber = request.ChassisNumber?.Trim().ToUpper();
        entity.EngineNumber = request.EngineNumber?.Trim().ToUpper();
        entity.RegistrationDate = request.RegistrationDate;
        entity.InsuranceExpiryDate = request.InsuranceExpiryDate;
        entity.Status = request.Status;
        entity.CurrentLocation = request.CurrentLocation?.Trim();
        entity.DailyRentalPrice = request.DailyRentalPrice;
        entity.ImageUrl = request.ImageUrl?.Trim();
        entity.Description = request.Description?.Trim();
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        // Create history record if status changed
        if (oldStatus != entity.Status)
        {
            await CreateHistoryAsync(entity.Id, "StatusChanged", oldStatus, entity.Status, $"Thay đổi trạng thái từ {oldStatus} sang {entity.Status}");
        }

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin xe sau khi cập nhật");
    }

    public async Task DeleteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<VehicleDto> CopyAsync(int id)
    {
        var source = await _repository.GetByIdAsync(id);
        if (source == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy xe với ID {id}");
        }

        // Generate new Code
        var baseCode = source.Code;
        var newCode = baseCode;
        var counter = 1;
        while (await _context.Vehicles.AnyAsync(v => v.Code == newCode && !v.IsDeleted))
        {
            newCode = $"{baseCode}_{counter}";
            counter++;
        }

        // Generate new LicensePlate
        var baseLicensePlate = source.LicensePlate;
        var newLicensePlate = baseLicensePlate;
        counter = 1;
        while (await _context.Vehicles.AnyAsync(v => v.LicensePlate == newLicensePlate && !v.IsDeleted))
        {
            newLicensePlate = $"{baseLicensePlate}_{counter}";
            counter++;
        }

        var newEntity = new Vehicle
        {
            Code = newCode,
            VehicleTypeId = source.VehicleTypeId,
            VehicleBrandId = source.VehicleBrandId,
            VehicleColorId = source.VehicleColorId,
            Model = $"{source.Model} (Copy)",
            Year = source.Year,
            SeatCount = source.SeatCount,
            FuelType = source.FuelType,
            LicensePlate = newLicensePlate,
            ChassisNumber = null, // Reset unique fields
            EngineNumber = source.EngineNumber,
            RegistrationDate = source.RegistrationDate,
            InsuranceExpiryDate = source.InsuranceExpiryDate,
            Status = VehicleStatus.Available,
            CurrentLocation = source.CurrentLocation,
            DailyRentalPrice = source.DailyRentalPrice,
            ImageUrl = source.ImageUrl,
            Description = source.Description,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(newEntity);

        // Create history record
        await CreateHistoryAsync(newEntity.Id, VehicleHistoryAction.Created, null, newEntity.Status, "Tạo bản sao xe");

        return await GetByIdAsync(newEntity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin xe sau khi tạo bản sao");
    }

    public async Task<List<VehicleDto>> GetAvailableAsync()
    {
        var vehicles = await _context.Vehicles
            .Include(v => v.VehicleType)
            .Include(v => v.VehicleBrand)
            .Include(v => v.VehicleColor)
                .Where(v => !v.IsDeleted && v.Status == VehicleStatus.Available)
            .OrderBy(v => v.Code)
            .ToListAsync();

        return vehicles.Select(v => new VehicleDto
        {
            Id = v.Id,
            Code = v.Code,
            VehicleTypeId = v.VehicleTypeId,
            VehicleTypeName = v.VehicleType.Name,
            VehicleBrandId = v.VehicleBrandId,
            VehicleBrandName = v.VehicleBrand.Name,
            VehicleColorId = v.VehicleColorId,
            VehicleColorName = v.VehicleColor.Name,
            Model = v.Model,
            Year = v.Year,
            SeatCount = v.SeatCount,
            FuelType = v.FuelType,
            LicensePlate = v.LicensePlate,
            ChassisNumber = v.ChassisNumber,
            EngineNumber = v.EngineNumber,
            RegistrationDate = v.RegistrationDate,
            InsuranceExpiryDate = v.InsuranceExpiryDate,
            Status = v.Status,
            CurrentLocation = v.CurrentLocation,
            DailyRentalPrice = v.DailyRentalPrice,
            ImageUrl = v.ImageUrl,
            Description = v.Description,
            CreatedDate = v.CreatedDate,
            CreatedBy = v.CreatedBy,
            ModifiedDate = v.ModifiedDate,
            ModifiedBy = v.ModifiedBy
        }).ToList();
    }

    public async Task<List<VehicleHistoryDto>> GetHistoryAsync(int vehicleId)
    {
        var histories = await _context.VehicleHistories
            .Where(h => h.VehicleId == vehicleId && !h.IsDeleted)
            .OrderByDescending(h => h.CreatedDate)
            .ToListAsync();

        return histories.Select(h => new VehicleHistoryDto
        {
            Id = h.Id,
            VehicleId = h.VehicleId,
            ActionType = h.ActionType,
            OldStatus = h.OldStatus,
            NewStatus = h.NewStatus,
            ReferenceId = h.ReferenceId,
            ReferenceType = h.ReferenceType,
            Description = h.Description,
            CreatedDate = h.CreatedDate,
            CreatedBy = h.CreatedBy
        }).ToList();
    }

    private async Task CreateHistoryAsync(int vehicleId, string actionType, string? oldStatus, string? newStatus, string? description)
    {
        var history = new VehicleHistory
        {
            VehicleId = vehicleId,
            ActionType = actionType,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Description = description,
            CreatedDate = DateTime.UtcNow
        };

        await _context.VehicleHistories.AddAsync(history);
        await _context.SaveChangesAsync();
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
        if (!ExcelImportHelper.ValidateSheetName(worksheet, ExcelSheetNames.Vehicle))
        {
            response.Success = false;
            response.Message = $"Tên sheet không đúng. Yêu cầu: '{ExcelSheetNames.Vehicle}'";
            errors.Add(new ImportError { Row = 0, Message = $"Tên sheet không đúng. Yêu cầu: '{ExcelSheetNames.Vehicle}'" });
            response.Errors = errors;
            return response;
        }

        var rowCount = worksheet.Dimension.Rows;
        response.TotalRows = rowCount - 1;

        // Read headers
        var headers = ExcelImportHelper.ReadHeaders(worksheet, 1);

        // Validate required columns
        if (ExcelImportHelper.GetColumnIndex(headers, "Biển số", "Code", "Biển số xe") == -1)
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Biển số' hoặc 'Code'", Field = "Code" });
        }
        if (ExcelImportHelper.GetColumnIndex(headers, "Loại xe", "VehicleType", "VehicleTypeName") == -1)
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Loại xe' hoặc 'VehicleType'", Field = "VehicleTypeId" });
        }
        if (ExcelImportHelper.GetColumnIndex(headers, "Hãng xe", "VehicleBrand", "VehicleBrandName") == -1)
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Hãng xe' hoặc 'VehicleBrand'", Field = "VehicleBrandId" });
        }
        if (ExcelImportHelper.GetColumnIndex(headers, "Màu xe", "VehicleColor", "VehicleColorName") == -1)
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Màu xe' hoặc 'VehicleColor'", Field = "VehicleColorId" });
        }
        if (ExcelImportHelper.GetColumnIndex(headers, "Model", "model") == -1)
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Model'", Field = "Model" });
        }
        if (ExcelImportHelper.GetColumnIndex(headers, "Biển số đăng ký", "LicensePlate") == -1)
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Biển số đăng ký' hoặc 'LicensePlate'", Field = "LicensePlate" });
        }
        if (ExcelImportHelper.GetColumnIndex(headers, "Giá thuê/ngày", "DailyRentalPrice", "Giá thuê") == -1)
        {
            errors.Add(new ImportError { Row = 1, Message = "Thiếu cột 'Giá thuê/ngày' hoặc 'DailyRentalPrice'", Field = "DailyRentalPrice" });
        }

        if (errors.Any())
        {
            response.Success = false;
            response.Errors = errors;
            response.Message = ExcelImportHelper.AggregateErrors(errors.Select(e => (e.Row, e.Message)).ToList());
            return response;
        }

        // Get column indices
        int codeCol = ExcelImportHelper.GetColumnIndex(headers, "Biển số", "Code", "Biển số xe");
        int vehicleTypeCol = ExcelImportHelper.GetColumnIndex(headers, "Loại xe", "VehicleType", "VehicleTypeName", "VehicleTypeCode");
        int vehicleBrandCol = ExcelImportHelper.GetColumnIndex(headers, "Hãng xe", "VehicleBrand", "VehicleBrandName", "VehicleBrandCode");
        int vehicleColorCol = ExcelImportHelper.GetColumnIndex(headers, "Màu xe", "VehicleColor", "VehicleColorName", "VehicleColorCode");
        int modelCol = ExcelImportHelper.GetColumnIndex(headers, "Model", "model");
        int yearCol = ExcelImportHelper.GetColumnIndex(headers, "Năm", "Year", "Năm sản xuất");
        int seatCountCol = ExcelImportHelper.GetColumnIndex(headers, "Số chỗ", "SeatCount", "Số chỗ ngồi");
        int fuelTypeCol = ExcelImportHelper.GetColumnIndex(headers, "Loại nhiên liệu", "FuelType");
        int licensePlateCol = ExcelImportHelper.GetColumnIndex(headers, "Biển số đăng ký", "LicensePlate");
        int chassisNumberCol = ExcelImportHelper.GetColumnIndex(headers, "Số khung", "ChassisNumber");
        int engineNumberCol = ExcelImportHelper.GetColumnIndex(headers, "Số máy", "EngineNumber");
        int registrationDateCol = ExcelImportHelper.GetColumnIndex(headers, "Ngày đăng ký", "RegistrationDate");
        int insuranceExpiryDateCol = ExcelImportHelper.GetColumnIndex(headers, "Ngày hết hạn bảo hiểm", "InsuranceExpiryDate");
        int statusCol = ExcelImportHelper.GetColumnIndex(headers, "Trạng thái", "Status");
        int currentLocationCol = ExcelImportHelper.GetColumnIndex(headers, "Vị trí", "CurrentLocation", "Vị trí hiện tại");
        int dailyRentalPriceCol = ExcelImportHelper.GetColumnIndex(headers, "Giá thuê/ngày", "DailyRentalPrice", "Giá thuê");
        int imageUrlCol = ExcelImportHelper.GetColumnIndex(headers, "Hình ảnh", "ImageUrl", "Image");
        int descriptionCol = ExcelImportHelper.GetColumnIndex(headers, "Mô tả", "Description");

        // Load master data for validation
        var vehicleTypes = await _context.VehicleTypes.Where(vt => !vt.IsDeleted).ToListAsync();
        var vehicleBrands = await _context.VehicleBrands.Where(vb => !vb.IsDeleted).ToListAsync();
        var vehicleColors = await _context.VehicleColors.Where(vc => !vc.IsDeleted).ToListAsync();

        var entitiesToAdd = new List<Vehicle>();

        // Validate all rows first before inserting
        for (int row = 2; row <= rowCount; row++)
        {
            var codeValue = ExcelImportHelper.GetCellValue(worksheet, row, codeCol);
            var vehicleTypeValue = ExcelImportHelper.GetCellValue(worksheet, row, vehicleTypeCol);
            var vehicleBrandValue = ExcelImportHelper.GetCellValue(worksheet, row, vehicleBrandCol);
            var vehicleColorValue = ExcelImportHelper.GetCellValue(worksheet, row, vehicleColorCol);
            var modelValue = ExcelImportHelper.GetCellValue(worksheet, row, modelCol);
            var yearValue = yearCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, yearCol) : null;
            var seatCountValue = seatCountCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, seatCountCol) : null;
            var fuelTypeValue = fuelTypeCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, fuelTypeCol) : null;
            var licensePlateValue = ExcelImportHelper.GetCellValue(worksheet, row, licensePlateCol);
            var chassisNumberValue = chassisNumberCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, chassisNumberCol) : null;
            var engineNumberValue = engineNumberCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, engineNumberCol) : null;
            var registrationDateValue = registrationDateCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, registrationDateCol) : null;
            var insuranceExpiryDateValue = insuranceExpiryDateCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, insuranceExpiryDateCol) : null;
            var statusValue = statusCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, statusCol) : null;
            var currentLocationValue = currentLocationCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, currentLocationCol) : null;
            var dailyRentalPriceValue = ExcelImportHelper.GetCellValue(worksheet, row, dailyRentalPriceCol);
            var imageUrlValue = imageUrlCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, imageUrlCol) : null;
            var descriptionValue = descriptionCol > 0 ? ExcelImportHelper.GetCellValue(worksheet, row, descriptionCol) : null;

            // Validate required fields
            var codeError = ExcelImportHelper.ValidateRequired(codeValue, "Biển số");
            if (codeError != null)
            {
                errors.Add(new ImportError { Row = row, Message = codeError, Field = "Code" });
                continue;
            }

            var modelError = ExcelImportHelper.ValidateRequired(modelValue, "Model");
            if (modelError != null)
            {
                errors.Add(new ImportError { Row = row, Message = modelError, Field = "Model" });
                continue;
            }

            var licensePlateError = ExcelImportHelper.ValidateRequired(licensePlateValue, "Biển số đăng ký");
            if (licensePlateError != null)
            {
                errors.Add(new ImportError { Row = row, Message = licensePlateError, Field = "LicensePlate" });
                continue;
            }

            // Validate and find VehicleType
            var vehicleType = vehicleTypes.FirstOrDefault(vt => 
                vt.Code.Equals(vehicleTypeValue?.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase) ||
                vt.Name.Equals(vehicleTypeValue?.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase));
            if (vehicleType == null)
            {
                errors.Add(new ImportError { Row = row, Message = $"Loại xe '{vehicleTypeValue}' không tồn tại", Field = "VehicleTypeId" });
                continue;
            }

            // Validate and find VehicleBrand
            var vehicleBrand = vehicleBrands.FirstOrDefault(vb => 
                vb.Code.Equals(vehicleBrandValue?.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase) ||
                vb.Name.Equals(vehicleBrandValue?.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase));
            if (vehicleBrand == null)
            {
                errors.Add(new ImportError { Row = row, Message = $"Hãng xe '{vehicleBrandValue}' không tồn tại", Field = "VehicleBrandId" });
                continue;
            }

            // Validate and find VehicleColor
            var vehicleColor = vehicleColors.FirstOrDefault(vc => 
                vc.Code.Equals(vehicleColorValue?.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase) ||
                vc.Name.Equals(vehicleColorValue?.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase));
            if (vehicleColor == null)
            {
                errors.Add(new ImportError { Row = row, Message = $"Màu xe '{vehicleColorValue}' không tồn tại", Field = "VehicleColorId" });
                continue;
            }

            // Validate max length
            var codeLengthError = ExcelImportHelper.ValidateMaxLength(codeValue, "Biển số", 50);
            if (codeLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = codeLengthError, Field = "Code" });
                continue;
            }

            var modelLengthError = ExcelImportHelper.ValidateMaxLength(modelValue, "Model", 100);
            if (modelLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = modelLengthError, Field = "Model" });
                continue;
            }

            var licensePlateLengthError = ExcelImportHelper.ValidateMaxLength(licensePlateValue, "Biển số đăng ký", 20);
            if (licensePlateLengthError != null)
            {
                errors.Add(new ImportError { Row = row, Message = licensePlateLengthError, Field = "LicensePlate" });
                continue;
            }

            // Validate Year
            int year = 0;
            if (yearValue != null)
            {
                if (!int.TryParse(yearValue.ToString(), out year) || year < 1900 || year > 2100)
                {
                    errors.Add(new ImportError { Row = row, Message = "Năm sản xuất phải là số từ 1900 đến 2100", Field = "Year" });
                    continue;
                }
            }
            else
            {
                errors.Add(new ImportError { Row = row, Message = "Năm sản xuất là bắt buộc", Field = "Year" });
                continue;
            }

            // Validate SeatCount
            int seatCount = 0;
            if (seatCountValue != null)
            {
                if (!int.TryParse(seatCountValue.ToString(), out seatCount) || seatCount < 2 || seatCount > 50)
                {
                    errors.Add(new ImportError { Row = row, Message = "Số chỗ ngồi phải là số từ 2 đến 50", Field = "SeatCount" });
                    continue;
                }
            }
            else
            {
                errors.Add(new ImportError { Row = row, Message = "Số chỗ ngồi là bắt buộc", Field = "SeatCount" });
                continue;
            }

            // Validate FuelType
            string fuelType = string.Empty;
            if (fuelTypeValue != null)
            {
                fuelType = fuelTypeValue.ToString()?.Trim() ?? string.Empty;
                if (string.IsNullOrWhiteSpace(fuelType))
                {
                    errors.Add(new ImportError { Row = row, Message = "Loại nhiên liệu là bắt buộc", Field = "FuelType" });
                    continue;
                }
                if (fuelType.Length > 20)
                {
                    errors.Add(new ImportError { Row = row, Message = "Loại nhiên liệu không được vượt quá 20 ký tự", Field = "FuelType" });
                    continue;
                }
            }
            else
            {
                errors.Add(new ImportError { Row = row, Message = "Loại nhiên liệu là bắt buộc", Field = "FuelType" });
                continue;
            }

            // Validate DailyRentalPrice
            decimal dailyRentalPrice = 0;
            if (dailyRentalPriceValue != null)
            {
                if (!decimal.TryParse(dailyRentalPriceValue.ToString(), out dailyRentalPrice) || dailyRentalPrice < 0)
                {
                    errors.Add(new ImportError { Row = row, Message = "Giá thuê/ngày phải là số >= 0", Field = "DailyRentalPrice" });
                    continue;
                }
            }
            else
            {
                errors.Add(new ImportError { Row = row, Message = "Giá thuê/ngày là bắt buộc", Field = "DailyRentalPrice" });
                continue;
            }

            // Parse dates
            DateTime? registrationDate = null;
            if (registrationDateValue != null)
            {
                var (regDate, regDateError) = ExcelImportHelper.TryParseDateTime(registrationDateValue, "Ngày đăng ký");
                if (regDateError != null)
                {
                    errors.Add(new ImportError { Row = row, Message = regDateError, Field = "RegistrationDate" });
                    continue;
                }
                registrationDate = regDate;
            }

            DateTime? insuranceExpiryDate = null;
            if (insuranceExpiryDateValue != null)
            {
                var (insDate, insDateError) = ExcelImportHelper.TryParseDateTime(insuranceExpiryDateValue, "Ngày hết hạn bảo hiểm");
                if (insDateError != null)
                {
                    errors.Add(new ImportError { Row = row, Message = insDateError, Field = "InsuranceExpiryDate" });
                    continue;
                }
                insuranceExpiryDate = insDate;
            }

            // Parse Status (default to Available)
            string status = VehicleStatus.Available;
            if (statusValue != null)
            {
                var statusText = statusValue.ToString()?.Trim() ?? string.Empty;
                // Map vehicle status
                status = statusText.ToLower() switch
                {
                    "có sẵn" or "available" or "available" => VehicleStatus.Available,
                    "đang cho thuê" or "rented" => VehicleStatus.Rented,
                    "đang bảo dưỡng" or "maintenance" => VehicleStatus.Maintenance,
                    "đang sửa chữa" or "repair" => VehicleStatus.Repair,
                    "ngừng hoạt động" or "outofservice" => VehicleStatus.OutOfService,
                    "đang vận chuyển" or "intransit" => VehicleStatus.InTransit,
                    _ => VehicleStatus.Available
                };
            }

            // Process values
            var code = codeValue?.ToString()?.Trim().ToUpper() ?? string.Empty;
            var licensePlate = licensePlateValue?.ToString()?.Trim().ToUpper() ?? string.Empty;
            var chassisNumber = chassisNumberValue?.ToString()?.Trim().ToUpper();
            var engineNumber = engineNumberValue?.ToString()?.Trim().ToUpper();
            var model = modelValue?.ToString()?.Trim() ?? string.Empty;
            var currentLocation = currentLocationValue?.ToString()?.Trim();
            var imageUrl = imageUrlValue?.ToString()?.Trim();
            var description = descriptionValue?.ToString()?.Trim();

            // Check if Code already exists in DB
            if (await _context.Vehicles.AnyAsync(v => v.Code == code && !v.IsDeleted))
            {
                errors.Add(new ImportError { Row = row, Message = $"Biển số '{code}' đã tồn tại", Field = "Code" });
                continue;
            }

            // Check if LicensePlate already exists in DB
            if (await _context.Vehicles.AnyAsync(v => v.LicensePlate == licensePlate && !v.IsDeleted))
            {
                errors.Add(new ImportError { Row = row, Message = $"Biển số đăng ký '{licensePlate}' đã tồn tại", Field = "LicensePlate" });
                continue;
            }

            // Check if ChassisNumber already exists (if provided)
            if (!string.IsNullOrWhiteSpace(chassisNumber) &&
                await _context.Vehicles.AnyAsync(v => v.ChassisNumber == chassisNumber && !v.IsDeleted))
            {
                errors.Add(new ImportError { Row = row, Message = $"Số khung '{chassisNumber}' đã tồn tại", Field = "ChassisNumber" });
                continue;
            }

            // Check for duplicate codes within the current import batch
            if (entitiesToAdd.Any(e => e.Code == code))
            {
                errors.Add(new ImportError { Row = row, Message = $"Biển số '{code}' bị trùng trong file Excel", Field = "Code" });
                continue;
            }

            // All validations passed, prepare entity
            entitiesToAdd.Add(new Vehicle
            {
                Code = code,
                VehicleTypeId = vehicleType.Id,
                VehicleBrandId = vehicleBrand.Id,
                VehicleColorId = vehicleColor.Id,
                Model = model,
                Year = year,
                SeatCount = seatCount,
                FuelType = fuelType,
                LicensePlate = licensePlate,
                ChassisNumber = chassisNumber,
                EngineNumber = engineNumber,
                RegistrationDate = registrationDate,
                InsuranceExpiryDate = insuranceExpiryDate,
                Status = status,
                CurrentLocation = currentLocation,
                DailyRentalPrice = dailyRentalPrice,
                ImageUrl = imageUrl,
                Description = description,
                CreatedDate = DateTime.UtcNow
            });
        }

        // If there are any errors, don't import anything
        if (errors.Any())
        {
            response.Success = false;
            response.Errors = errors;
            response.Message = ExcelImportHelper.AggregateErrors(errors.Select(e => (e.Row, e.Message)).ToList());
            return response;
        }

        // All validations passed, import all rows
        if (entitiesToAdd.Any())
        {
            await _context.Vehicles.AddRangeAsync(entitiesToAdd);
            await _context.SaveChangesAsync();
            response.SuccessCount = entitiesToAdd.Count;
        }

        response.Success = true;
        response.Message = $"Import thành công {response.SuccessCount} dòng";
        return response;
    }

    public async Task<MemoryStream> ExportExcelAsync(List<int>? ids)
    {
        List<Vehicle> data;
        if (ids == null || ids.Count == 0)
        {
            data = await _context.Vehicles
                .Include(v => v.VehicleType)
                .Include(v => v.VehicleBrand)
                .Include(v => v.VehicleColor)
                .Where(v => !v.IsDeleted)
                .OrderBy(v => v.Code)
                .ToListAsync();
        }
        else
        {
            data = await _context.Vehicles
                .Include(v => v.VehicleType)
                .Include(v => v.VehicleBrand)
                .Include(v => v.VehicleColor)
                .Where(v => !v.IsDeleted && ids.Contains(v.Id))
                .OrderBy(v => v.Code)
                .ToListAsync();
        }

        // Create anonymous objects for export with formatted values
        var exportData = data.Select(v => new
        {
            Code = v.Code,
            VehicleTypeName = v.VehicleType.Name,
            VehicleBrandName = v.VehicleBrand.Name,
            VehicleColorName = v.VehicleColor.Name,
            Model = v.Model,
            Year = v.Year,
            SeatCount = v.SeatCount,
            FuelType = v.FuelType,
            LicensePlate = v.LicensePlate,
            ChassisNumber = v.ChassisNumber ?? string.Empty,
            EngineNumber = v.EngineNumber ?? string.Empty,
            RegistrationDate = v.RegistrationDate,
            InsuranceExpiryDate = v.InsuranceExpiryDate,
            Status = FormatVehicleStatus(v.Status),
            CurrentLocation = v.CurrentLocation ?? string.Empty,
            DailyRentalPrice = v.DailyRentalPrice,
            ImageUrl = v.ImageUrl ?? string.Empty,
            Description = v.Description ?? string.Empty
        }).ToList();

        // Column mapping
        var columnMapping = new Dictionary<string, string>
        {
            { "Code", "Biển số" },
            { "VehicleTypeName", "Loại xe" },
            { "VehicleBrandName", "Hãng xe" },
            { "VehicleColorName", "Màu xe" },
            { "Model", "Model" },
            { "Year", "Năm sản xuất" },
            { "SeatCount", "Số chỗ" },
            { "FuelType", "Loại nhiên liệu" },
            { "LicensePlate", "Biển số đăng ký" },
            { "ChassisNumber", "Số khung" },
            { "EngineNumber", "Số máy" },
            { "RegistrationDate", "Ngày đăng ký" },
            { "InsuranceExpiryDate", "Ngày hết hạn bảo hiểm" },
            { "Status", "Trạng thái" },
            { "CurrentLocation", "Vị trí" },
            { "DailyRentalPrice", "Giá thuê/ngày" },
            { "ImageUrl", "Hình ảnh" },
            { "Description", "Mô tả" }
        };

        return await ExcelExportHelper.ExportToExcelAsync(
            data: exportData,
            columnMapping: columnMapping,
            sheetName: "Xe"
        );
    }

    private static string FormatVehicleStatus(string status)
    {
        return status switch
        {
            VehicleStatus.Available => "Có sẵn",
            VehicleStatus.Rented => "Đang cho thuê",
            VehicleStatus.Maintenance => "Đang bảo dưỡng",
            VehicleStatus.Repair => "Đang sửa chữa",
            VehicleStatus.OutOfService => "Ngừng hoạt động",
            VehicleStatus.InTransit => "Đang vận chuyển",
            _ => status
        };
    }

    public async Task DeleteMultipleAsync(List<int> ids)
    {
        if (ids == null || ids.Count == 0)
        {
            throw new ArgumentException("Danh sách ID không được rỗng");
        }

        var entities = await _context.Vehicles
            .Where(v => ids.Contains(v.Id) && !v.IsDeleted)
            .ToListAsync();

        if (entities.Count != ids.Count)
        {
            throw new KeyNotFoundException("Một số ID không tìm thấy");
        }

        foreach (var entity in entities)
        {
            entity.IsDeleted = true;
            entity.ModifiedDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}

