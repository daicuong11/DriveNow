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

public class VehicleMaintenanceService : IVehicleMaintenanceService
{
    private readonly IRepository<VehicleMaintenance> _repository;
    private readonly ApplicationDbContext _context;

    public VehicleMaintenanceService(IRepository<VehicleMaintenance> repository, ApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<PagedResult<VehicleMaintenanceDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.VehicleMaintenances
            .Include(v => v.Vehicle)
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

        // Filter by Status if provided
        if (!string.IsNullOrWhiteSpace(request.FilterStatus))
        {
            query = query.Where(v => v.Status == request.FilterStatus.Trim());
        }

        // Search
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().NormalizeForSearch();
            query = query.Where(v =>
                v.Vehicle.Code.Contains(searchTerm) ||
                (v.Vehicle.Model != null && v.Vehicle.Model.Contains(searchTerm)) ||
                v.Description.Contains(searchTerm) ||
                (v.ServiceProvider != null && v.ServiceProvider.Contains(searchTerm))
            );
        }

        // Sorting
        if (!string.IsNullOrWhiteSpace(request.SortBy))
        {
            query = request.SortBy.ToLower() switch
            {
                "startdate" => request.SortDescending ? query.OrderByDescending(v => v.StartDate) : query.OrderBy(v => v.StartDate),
                "vehiclecode" => request.SortDescending ? query.OrderByDescending(v => v.Vehicle.Code) : query.OrderBy(v => v.Vehicle.Code),
                "type" => request.SortDescending ? query.OrderByDescending(v => v.Type) : query.OrderBy(v => v.Type),
                "status" => request.SortDescending ? query.OrderByDescending(v => v.Status) : query.OrderBy(v => v.Status),
                _ => query.OrderByDescending(v => v.StartDate)
            };
        }
        else
        {
            query = query.OrderByDescending(v => v.StartDate);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(v => new VehicleMaintenanceDto
            {
                Id = v.Id,
                VehicleId = v.VehicleId,
                VehicleCode = v.Vehicle.Code,
                VehicleModel = v.Vehicle.Model,
                Type = v.Type,
                StartDate = v.StartDate,
                EndDate = v.EndDate,
                Description = v.Description,
                Cost = v.Cost,
                ServiceProvider = v.ServiceProvider,
                Status = v.Status,
                CreatedDate = v.CreatedDate,
                CreatedBy = v.CreatedBy,
                ModifiedDate = v.ModifiedDate,
                ModifiedBy = v.ModifiedBy
            })
            .ToListAsync();

        return new PagedResult<VehicleMaintenanceDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<VehicleMaintenanceDto?> GetByIdAsync(int id)
    {
        var entity = await _context.VehicleMaintenances
            .Include(v => v.Vehicle)
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);

        if (entity == null) return null;

        return new VehicleMaintenanceDto
        {
            Id = entity.Id,
            VehicleId = entity.VehicleId,
            VehicleCode = entity.Vehicle.Code,
            VehicleModel = entity.Vehicle.Model,
            Type = entity.Type,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            Description = entity.Description,
            Cost = entity.Cost,
            ServiceProvider = entity.ServiceProvider,
            Status = entity.Status,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            ModifiedDate = entity.ModifiedDate,
            ModifiedBy = entity.ModifiedBy
        };
    }

    public async Task<VehicleMaintenanceDto> CreateAsync(CreateVehicleMaintenanceRequest request)
    {
        // Validate Vehicle exists
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == request.VehicleId && !v.IsDeleted);

        if (vehicle == null)
        {
            throw new InvalidOperationException("Xe không tồn tại");
        }

        // Validate Type
        if (request.Type != "Maintenance" && request.Type != "Repair")
        {
            throw new InvalidOperationException("Loại phải là 'Maintenance' hoặc 'Repair'");
        }

        // Validate Status
        if (request.Status != "InProgress" && request.Status != "Completed" && request.Status != "Cancelled")
        {
            throw new InvalidOperationException("Trạng thái không hợp lệ");
        }

        // Business logic: Update vehicle status based on Type and Status
        string? oldStatus = vehicle.Status;
        string? newStatus = null;

        if (request.Status == "InProgress")
        {
            // Only allow if vehicle is Available
            if (vehicle.Status != VehicleStatusConstants.Available)
            {
                throw new InvalidOperationException($"Không thể bắt đầu bảo dưỡng/sửa chữa khi trạng thái xe là '{GetStatusDisplayName(vehicle.Status)}'");
            }
            newStatus = request.Type == "Maintenance" ? VehicleStatusConstants.Maintenance : VehicleStatusConstants.Repair;
            vehicle.Status = newStatus;
        }

        // Create VehicleMaintenance
        var entity = new VehicleMaintenance
        {
            VehicleId = request.VehicleId,
            Type = request.Type,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Description = request.Description,
            Cost = request.Cost,
            ServiceProvider = request.ServiceProvider,
            Status = request.Status,
            CreatedDate = DateTime.UtcNow
        };

        await _context.VehicleMaintenances.AddAsync(entity);
        await _context.SaveChangesAsync();

        // Create VehicleHistory
        await CreateHistoryAsync(
            request.VehicleId,
            request.Type == "Maintenance" ? VehicleHistoryActionTypeConstants.Maintenance : VehicleHistoryActionTypeConstants.Repair,
            oldStatus,
            newStatus,
            $"Bắt đầu {GetTypeDisplayName(request.Type)}: {request.Description}"
        );

        await _context.SaveChangesAsync();

        // Reload with includes
        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<VehicleMaintenanceDto> UpdateAsync(int id, UpdateVehicleMaintenanceRequest request)
    {
        var entity = await _context.VehicleMaintenances
            .Include(v => v.Vehicle)
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bản ghi bảo dưỡng/sửa chữa");
        }

        // Validate Status
        if (request.Status != "InProgress" && request.Status != "Completed" && request.Status != "Cancelled")
        {
            throw new InvalidOperationException("Trạng thái không hợp lệ");
        }

        string? oldStatus = entity.Vehicle.Status;
        string? newStatus = null;

        // Business logic: Update vehicle status
        if (request.Status == "Completed" && entity.Status != "Completed")
        {
            // Complete maintenance/repair: set vehicle to Available
            newStatus = VehicleStatusConstants.Available;
            entity.Vehicle.Status = newStatus;
            if (!entity.EndDate.HasValue)
            {
                entity.EndDate = DateTime.UtcNow;
            }
        }
        else if (request.Status == "Cancelled" && entity.Status != "Cancelled")
        {
            // Cancel: set vehicle back to Available if it was in maintenance/repair
            if (entity.Vehicle.Status == VehicleStatusConstants.Maintenance || entity.Vehicle.Status == VehicleStatusConstants.Repair)
            {
                newStatus = VehicleStatusConstants.Available;
                entity.Vehicle.Status = newStatus;
            }
        }

        // Update fields
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.Description = request.Description;
        entity.Cost = request.Cost;
        entity.ServiceProvider = request.ServiceProvider;
        entity.Status = request.Status;
        entity.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Create VehicleHistory if status changed
        if (newStatus != null)
        {
            string actionType = request.Status == "Completed"
                ? (entity.Type == "Maintenance" ? VehicleHistoryActionTypeConstants.MaintenanceCompleted : VehicleHistoryActionTypeConstants.RepairCompleted)
                : "Cancelled";
            await CreateHistoryAsync(
                entity.VehicleId,
                actionType,
                oldStatus,
                newStatus,
                $"{(request.Status == "Completed" ? "Hoàn thành" : "Hủy")} {GetTypeDisplayName(entity.Type)}: {request.Description}"
            );
            await _context.SaveChangesAsync();
        }

        return (await GetByIdAsync(id))!;
    }

    public async Task<VehicleMaintenanceDto> CompleteAsync(int id)
    {
        var entity = await _context.VehicleMaintenances
            .Include(v => v.Vehicle)
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bản ghi bảo dưỡng/sửa chữa");
        }

        if (entity.Status == "Completed")
        {
            throw new InvalidOperationException("Bảo dưỡng/sửa chữa đã được hoàn thành");
        }

        string? oldStatus = entity.Vehicle.Status;
        string newStatus = VehicleStatusConstants.Available;

        // Update entity
        entity.Status = "Completed";
        entity.EndDate = DateTime.UtcNow;
        entity.ModifiedDate = DateTime.UtcNow;

        // Update vehicle status
        entity.Vehicle.Status = newStatus;

        await _context.SaveChangesAsync();

        // Create VehicleHistory
        string actionType = entity.Type == "Maintenance"
            ? VehicleHistoryActionTypeConstants.MaintenanceCompleted
            : VehicleHistoryActionTypeConstants.RepairCompleted;
        await CreateHistoryAsync(
            entity.VehicleId,
            actionType,
            oldStatus,
            newStatus,
            $"Hoàn thành {GetTypeDisplayName(entity.Type)}: {entity.Description}"
        );

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.VehicleMaintenances
            .FirstOrDefaultAsync(v => v.Id == id && !v.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bản ghi bảo dưỡng/sửa chữa");
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

    private string GetTypeDisplayName(string type)
    {
        return type == "Maintenance" ? "bảo dưỡng" : "sửa chữa";
    }
}

