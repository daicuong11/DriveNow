using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Vehicle;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Data.Interfaces;
using DriveNow.Common.Constants;
using DriveNow.Common.Extensions;

namespace DriveNow.Business.Services;

public class VehicleInOutService : IVehicleInOutService
{
    private readonly IRepository<VehicleInOut> _repository;
    private readonly ApplicationDbContext _context;

    public VehicleInOutService(IRepository<VehicleInOut> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<VehicleInOutDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.VehicleInOuts
            .Include(v => v.Vehicle)
            .Include(v => v.Employee)
            .Where(v => !v.IsDeleted);

        // Filter by VehicleId if provided
        if (request.FilterVehicleId.HasValue)
        {
            query = query.Where(v => v.VehicleId == request.FilterVehicleId.Value);
        }

        // Filter by Type if provided
        if (!string.IsNullOrWhiteSpace(request.FilterType))
        {
            query = query.Where(v => v.Type == request.FilterType.Trim());
        }

        // Filter by EmployeeId if provided
        if (request.FilterEmployeeId.HasValue)
        {
            query = query.Where(v => v.EmployeeId == request.FilterEmployeeId.Value);
        }

        // Search
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().NormalizeForSearch();
            query = query.Where(v =>
                v.Vehicle.Code.Contains(searchTerm) ||
                (v.Vehicle.Model != null && v.Vehicle.Model.Contains(searchTerm)) ||
                (v.Location != null && v.Location.Contains(searchTerm)) ||
                (v.Reason != null && v.Reason.Contains(searchTerm)) ||
                (v.Employee.FullName != null && v.Employee.FullName.Contains(searchTerm))
            );
        }

        // Sorting
        if (!string.IsNullOrWhiteSpace(request.SortBy))
        {
            query = request.SortBy.ToLower() switch
            {
                "date" => request.SortDescending ? query.OrderByDescending(v => v.Date) : query.OrderBy(v => v.Date),
                "vehiclecode" => request.SortDescending ? query.OrderByDescending(v => v.Vehicle.Code) : query.OrderBy(v => v.Vehicle.Code),
                "type" => request.SortDescending ? query.OrderByDescending(v => v.Type) : query.OrderBy(v => v.Type),
                _ => query.OrderByDescending(v => v.Date)
            };
        }
        else
        {
            query = query.OrderByDescending(v => v.Date);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(v => new VehicleInOutDto
            {
                Id = v.Id,
                VehicleId = v.VehicleId,
                VehicleCode = v.Vehicle.Code,
                VehicleModel = v.Vehicle.Model,
                Type = v.Type,
                Date = v.Date,
                Location = v.Location,
                Reason = v.Reason,
                EmployeeId = v.EmployeeId,
                EmployeeName = v.Employee.FullName,
                Notes = v.Notes,
                CreatedDate = v.CreatedDate,
                CreatedBy = v.CreatedBy,
                ModifiedDate = v.ModifiedDate,
                ModifiedBy = v.ModifiedBy
            })
            .ToListAsync();

        return new PagedResult<VehicleInOutDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<VehicleInOutDto?> GetByIdAsync(int id)
    {
        var entity = await _context.VehicleInOuts
            .Include(v => v.Vehicle)
            .Include(v => v.Employee)
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);

        if (entity == null) return null;

        return new VehicleInOutDto
        {
            Id = entity.Id,
            VehicleId = entity.VehicleId,
            VehicleCode = entity.Vehicle.Code,
            VehicleModel = entity.Vehicle.Model,
            Type = entity.Type,
            Date = entity.Date,
            Location = entity.Location,
            Reason = entity.Reason,
            EmployeeId = entity.EmployeeId,
            EmployeeName = entity.Employee.FullName,
            Notes = entity.Notes,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            ModifiedDate = entity.ModifiedDate,
            ModifiedBy = entity.ModifiedBy
        };
    }

    public async Task<VehicleInOutDto> CreateAsync(CreateVehicleInOutRequest request)
    {
        // Validate Vehicle exists
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == request.VehicleId && !v.IsDeleted);

        if (vehicle == null)
        {
            throw new InvalidOperationException("Xe không tồn tại");
        }

        // Validate Employee exists
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId && !e.IsDeleted);

        if (employee == null)
        {
            throw new InvalidOperationException("Nhân viên không tồn tại");
        }

        // Validate Type
        if (request.Type != "In" && request.Type != "Out")
        {
            throw new InvalidOperationException("Loại phải là 'In' hoặc 'Out'");
        }

        // Business logic: Update vehicle status based on Type
        string? oldStatus = vehicle.Status;
        string? newStatus = null;

        if (request.Type == "Out")
        {
            // Only allow Out if vehicle is Available
            if (vehicle.Status != VehicleStatusConstants.Available)
            {
                throw new InvalidOperationException($"Không thể xuất xe khi trạng thái là '{GetStatusDisplayName(vehicle.Status)}'");
            }
            newStatus = VehicleStatusConstants.InTransit;
            vehicle.Status = newStatus;
        }
        else if (request.Type == "In")
        {
            // Allow In if vehicle is InTransit or Rented
            if (vehicle.Status != VehicleStatusConstants.InTransit && vehicle.Status != VehicleStatusConstants.Rented)
            {
                throw new InvalidOperationException($"Không thể nhập xe khi trạng thái là '{GetStatusDisplayName(vehicle.Status)}'");
            }
            newStatus = VehicleStatusConstants.Available;
            vehicle.Status = newStatus;
            if (!string.IsNullOrWhiteSpace(request.Location))
            {
                vehicle.CurrentLocation = request.Location;
            }
        }

        // Create VehicleInOut
        var entity = new VehicleInOut
        {
            VehicleId = request.VehicleId,
            Type = request.Type,
            Date = request.Date,
            Location = request.Location,
            Reason = request.Reason,
            EmployeeId = request.EmployeeId,
            Notes = request.Notes,
            CreatedDate = DateTime.UtcNow
        };

        await _context.VehicleInOuts.AddAsync(entity);
        await _context.SaveChangesAsync();

        // Create VehicleHistory
        await CreateHistoryAsync(
            request.VehicleId,
            request.Type == "In" ? VehicleHistoryActionTypeConstants.In : VehicleHistoryActionTypeConstants.Out,
            oldStatus,
            newStatus,
            $"{(request.Type == "In" ? "Nhập" : "Xuất")} bãi{(string.IsNullOrWhiteSpace(request.Location) ? "" : $" tại {request.Location}")}"
        );

        await _context.SaveChangesAsync();

        // Reload with includes
        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<VehicleInOutDto> UpdateAsync(int id, UpdateVehicleInOutRequest request)
    {
        var entity = await _context.VehicleInOuts
            .Include(v => v.Vehicle)
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bản ghi xuất/nhập bãi");
        }

        // Validate Employee exists
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId && !e.IsDeleted);

        if (employee == null)
        {
            throw new InvalidOperationException("Nhân viên không tồn tại");
        }

        // Update fields
        entity.Date = request.Date;
        entity.Location = request.Location;
        entity.Reason = request.Reason;
        entity.EmployeeId = request.EmployeeId;
        entity.Notes = request.Notes;
        entity.ModifiedDate = DateTime.UtcNow;

        // Update vehicle location if Type is In
        if (entity.Type == "In" && !string.IsNullOrWhiteSpace(request.Location))
        {
            entity.Vehicle.CurrentLocation = request.Location;
        }

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.VehicleInOuts
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bản ghi xuất/nhập bãi");
        }

        entity.IsDeleted = true;
        entity.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
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
    }

    private string GetStatusDisplayName(string status)
    {
        return status switch
        {
            VehicleStatusConstants.Available => "Có sẵn",
            VehicleStatusConstants.Rented => "Đang cho thuê",
            VehicleStatusConstants.Maintenance => "Đang bảo dưỡng",
            VehicleStatusConstants.Repair => "Đang sửa chữa",
            VehicleStatusConstants.OutOfService => "Ngừng hoạt động",
            VehicleStatusConstants.InTransit => "Đang vận chuyển",
            _ => status
        };
    }
}

