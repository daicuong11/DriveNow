using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.Rental;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Data.Interfaces;
using DriveNow.Common.Extensions;
using DriveNow.Common.Constants;
using VehicleStatus = DriveNow.Common.Constants.VehicleStatusConstants;
using VehicleHistoryAction = DriveNow.Common.Constants.VehicleHistoryActionTypeConstants;

namespace DriveNow.Business.Services;

public class RentalOrderService : IRentalOrderService
{
    private readonly IRepository<RentalOrder> _repository;
    private readonly ApplicationDbContext _context;
    private readonly IPromotionService _promotionService;

    public RentalOrderService(
        IRepository<RentalOrder> repository,
        ApplicationDbContext context,
        IPromotionService promotionService)
    {
        _repository = repository;
        _context = context;
        _promotionService = promotionService;
    }

    private string GenerateOrderNumber()
    {
        var today = DateTime.UtcNow;
        var prefix = $"RO{today:yyyyMMdd}";
        var lastOrder = _context.RentalOrders
            .Where(r => r.OrderNumber.StartsWith(prefix))
            .OrderByDescending(r => r.OrderNumber)
            .FirstOrDefault();

        int sequence = 1;
        if (lastOrder != null)
        {
            var lastSequence = lastOrder.OrderNumber.Substring(prefix.Length);
            if (int.TryParse(lastSequence, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"{prefix}{sequence:D3}";
    }

    public async Task<PagedResult<RentalOrderDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.RentalOrders
            .Include(r => r.Customer)
            .Include(r => r.Vehicle)
            .Include(r => r.Employee)
            .Where(r => !r.IsDeleted);

        // Normalize search and filter terms
        string? normalizedSearchTerm = null;
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            normalizedSearchTerm = request.SearchTerm.Trim().NormalizeForSearch();
        }

        // Apply basic filters
        if (!string.IsNullOrWhiteSpace(request.FilterStatus))
        {
            query = query.Where(r => r.Status == request.FilterStatus.Trim());
        }

        var allItems = await query.ToListAsync();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(r =>
                r.OrderNumber.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                r.Customer.FullName.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                r.Vehicle.Code.NormalizeForSearch().Contains(normalizedSearchTerm)
            ).ToList();
        }

        // Sort
        var sortedItems = request.SortBy?.ToLower() switch
        {
            "ordernumber" => request.SortDescending ? allItems.OrderByDescending(r => r.OrderNumber) : allItems.OrderBy(r => r.OrderNumber),
            "startdate" => request.SortDescending ? allItems.OrderByDescending(r => r.StartDate) : allItems.OrderBy(r => r.StartDate),
            "totalamount" => request.SortDescending ? allItems.OrderByDescending(r => r.TotalAmount) : allItems.OrderBy(r => r.TotalAmount),
            _ => allItems.OrderByDescending(r => r.CreatedDate)
        };

        var totalCount = sortedItems.Count();
        var items = sortedItems
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new RentalOrderDto
            {
                Id = r.Id,
                OrderNumber = r.OrderNumber,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer.FullName,
                CustomerPhone = r.Customer.Phone,
                VehicleId = r.VehicleId,
                VehicleCode = r.Vehicle.Code,
                VehicleModel = r.Vehicle.Model,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.Employee.FullName,
                StartDate = r.StartDate,
                EndDate = r.EndDate,
                ActualStartDate = r.ActualStartDate,
                ActualEndDate = r.ActualEndDate,
                PickupLocation = r.PickupLocation,
                ReturnLocation = r.ReturnLocation,
                DailyRentalPrice = r.DailyRentalPrice,
                TotalDays = r.TotalDays,
                SubTotal = r.SubTotal,
                DiscountAmount = r.DiscountAmount,
                PromotionCode = r.PromotionCode,
                TotalAmount = r.TotalAmount,
                DepositAmount = r.DepositAmount,
                Status = r.Status,
                Notes = r.Notes,
                CreatedDate = r.CreatedDate,
                CreatedBy = r.CreatedBy,
                ModifiedDate = r.ModifiedDate,
                ModifiedBy = r.ModifiedBy
            })
            .ToList();

        return new PagedResult<RentalOrderDto>
        {
            Data = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<RentalOrderDto?> GetByIdAsync(int id)
    {
        var entity = await _context.RentalOrders
            .Include(r => r.Customer)
            .Include(r => r.Vehicle)
            .Include(r => r.Employee)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (entity == null) return null;

        return new RentalOrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            CustomerId = entity.CustomerId,
            CustomerName = entity.Customer.FullName,
            CustomerPhone = entity.Customer.Phone,
            VehicleId = entity.VehicleId,
            VehicleCode = entity.Vehicle.Code,
            VehicleModel = entity.Vehicle.Model,
            EmployeeId = entity.EmployeeId,
            EmployeeName = entity.Employee.FullName,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            ActualStartDate = entity.ActualStartDate,
            ActualEndDate = entity.ActualEndDate,
            PickupLocation = entity.PickupLocation,
            ReturnLocation = entity.ReturnLocation,
            DailyRentalPrice = entity.DailyRentalPrice,
            TotalDays = entity.TotalDays,
            SubTotal = entity.SubTotal,
            DiscountAmount = entity.DiscountAmount,
            PromotionCode = entity.PromotionCode,
            TotalAmount = entity.TotalAmount,
            DepositAmount = entity.DepositAmount,
            Status = entity.Status,
            Notes = entity.Notes,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            ModifiedDate = entity.ModifiedDate,
            ModifiedBy = entity.ModifiedBy
        };
    }

    public async Task<CalculatePriceResponse> CalculatePriceAsync(CalculatePriceRequest request)
    {
        var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
        if (vehicle == null || vehicle.IsDeleted)
        {
            throw new KeyNotFoundException($"Không tìm thấy xe với ID {request.VehicleId}");
        }

        var totalDays = (request.EndDate.Date - request.StartDate.Date).Days + 1;
        var subTotal = vehicle.DailyRentalPrice * totalDays;
        decimal discountAmount = 0;
        string? promotionMessage = null;

        if (!string.IsNullOrWhiteSpace(request.PromotionCode))
        {
            var validateResult = await _promotionService.ValidatePromotionAsync(new ValidatePromotionRequest
            {
                PromotionCode = request.PromotionCode,
                SubTotal = subTotal,
                StartDate = request.StartDate,
                EndDate = request.EndDate
            });

            if (validateResult.IsValid)
            {
                discountAmount = validateResult.DiscountAmount;
                promotionMessage = validateResult.Message;
            }
            else
            {
                discountAmount = 0; // Reset discount if invalid
                promotionMessage = validateResult.Message;
            }
        }
        else
        {
            // Clear promotion message if no promotion code
            promotionMessage = null;
        }

        var totalAmount = subTotal - discountAmount;

        return new CalculatePriceResponse
        {
            DailyRentalPrice = vehicle.DailyRentalPrice,
            TotalDays = totalDays,
            SubTotal = subTotal,
            DiscountAmount = discountAmount,
            TotalAmount = totalAmount,
            PromotionMessage = promotionMessage
        };
    }

    public async Task<RentalOrderDto> CreateAsync(CreateRentalOrderRequest request)
    {
        // Validate vehicle is available
        var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
        if (vehicle == null || vehicle.IsDeleted)
        {
            throw new KeyNotFoundException($"Không tìm thấy xe với ID {request.VehicleId}");
        }

        if (request.Status == RentalStatusConstants.Confirmed && vehicle.Status != VehicleStatus.Available)
        {
            throw new InvalidOperationException($"Xe {vehicle.Code} không còn sẵn sàng để cho thuê");
        }

        // Calculate price
        var priceResult = await CalculatePriceAsync(new CalculatePriceRequest
        {
            VehicleId = request.VehicleId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            PromotionCode = request.PromotionCode
        });

        var totalDays = (request.EndDate.Date - request.StartDate.Date).Days + 1;

        var entity = new RentalOrder
        {
            OrderNumber = GenerateOrderNumber(),
            CustomerId = request.CustomerId,
            VehicleId = request.VehicleId,
            EmployeeId = request.EmployeeId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            PickupLocation = request.PickupLocation,
            ReturnLocation = request.ReturnLocation,
            DailyRentalPrice = priceResult.DailyRentalPrice,
            TotalDays = totalDays,
            SubTotal = priceResult.SubTotal,
            DiscountAmount = priceResult.DiscountAmount,
            PromotionCode = request.PromotionCode,
            TotalAmount = priceResult.TotalAmount,
            DepositAmount = request.DepositAmount,
            Status = request.Status,
            Notes = request.Notes,
            CreatedDate = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        // Create status history
        await CreateStatusHistoryAsync(entity.Id, null, entity.Status, "Tạo đơn thuê");

        // Update vehicle status if confirmed
        if (entity.Status == RentalStatusConstants.Confirmed)
        {
            vehicle.Status = VehicleStatus.Rented;
            vehicle.CurrentLocation = request.PickupLocation;
            await _context.SaveChangesAsync();

            // Create vehicle history
            await CreateVehicleHistoryAsync(vehicle.Id, VehicleHistoryAction.Rented, VehicleStatus.Available, VehicleStatus.Rented, entity.Id, "RentalOrder", $"Đơn thuê {entity.OrderNumber}");
        }

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin đơn thuê sau khi tạo");
    }

    public async Task<RentalOrderDto> UpdateAsync(int id, UpdateRentalOrderRequest request)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn thuê với ID {id}");
        }

        if (entity.Status != RentalStatusConstants.Draft)
        {
            throw new InvalidOperationException("Chỉ có thể sửa đơn thuê ở trạng thái Nháp");
        }

        var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
        if (vehicle == null || vehicle.IsDeleted)
        {
            throw new KeyNotFoundException($"Không tìm thấy xe với ID {request.VehicleId}");
        }

        // Calculate price
        var priceResult = await CalculatePriceAsync(new CalculatePriceRequest
        {
            VehicleId = request.VehicleId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            PromotionCode = request.PromotionCode
        });

        var totalDays = (request.EndDate.Date - request.StartDate.Date).Days + 1;

        entity.CustomerId = request.CustomerId;
        entity.VehicleId = request.VehicleId;
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.PickupLocation = request.PickupLocation;
        entity.ReturnLocation = request.ReturnLocation;
        entity.DailyRentalPrice = priceResult.DailyRentalPrice;
        entity.TotalDays = totalDays;
        entity.SubTotal = priceResult.SubTotal;
        entity.DiscountAmount = priceResult.DiscountAmount;
        entity.PromotionCode = request.PromotionCode;
        entity.TotalAmount = priceResult.TotalAmount;
        entity.DepositAmount = request.DepositAmount;
        entity.Notes = request.Notes;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin đơn thuê sau khi cập nhật");
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn thuê với ID {id}");
        }

        if (entity.Status != RentalStatusConstants.Draft && entity.Status != RentalStatusConstants.Cancelled)
        {
            throw new InvalidOperationException("Chỉ có thể xóa đơn thuê ở trạng thái Nháp hoặc Đã hủy");
        }

        await _repository.DeleteAsync(id);
    }

    public async Task<RentalOrderDto> ConfirmAsync(int id)
    {
        var entity = await _context.RentalOrders
            .Include(r => r.Vehicle)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn thuê với ID {id}");
        }

        if (entity.Status != RentalStatusConstants.Draft)
        {
            throw new InvalidOperationException($"Không thể xác nhận đơn thuê ở trạng thái {entity.Status}");
        }

        if (entity.Vehicle.Status != VehicleStatus.Available)
        {
            throw new InvalidOperationException($"Xe {entity.Vehicle.Code} không còn sẵn sàng để cho thuê");
        }

        var oldStatus = entity.Status;
        entity.Status = RentalStatusConstants.Confirmed;
        entity.ModifiedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(entity);

        // Create status history
        await CreateStatusHistoryAsync(entity.Id, oldStatus, entity.Status, "Xác nhận đơn thuê");

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin đơn thuê sau khi xác nhận");
    }

    public async Task<RentalOrderDto> StartAsync(int id)
    {
        var entity = await _context.RentalOrders
            .Include(r => r.Vehicle)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn thuê với ID {id}");
        }

        if (entity.Status != RentalStatusConstants.Confirmed)
        {
            throw new InvalidOperationException($"Không thể bắt đầu đơn thuê ở trạng thái {entity.Status}");
        }

        var oldStatus = entity.Status;
        entity.Status = RentalStatusConstants.InProgress;
        entity.ActualStartDate = DateTime.UtcNow;
        entity.ModifiedDate = DateTime.UtcNow;

        // Update vehicle
        entity.Vehicle.Status = VehicleStatus.Rented;
        entity.Vehicle.CurrentLocation = entity.PickupLocation;

        await _repository.UpdateAsync(entity);

        // Create status history
        await CreateStatusHistoryAsync(entity.Id, oldStatus, entity.Status, "Khách nhận xe");

        // Create vehicle history
        await CreateVehicleHistoryAsync(entity.VehicleId, VehicleHistoryAction.Rented, VehicleStatus.Available, VehicleStatus.Rented, entity.Id, "RentalOrder", $"Đơn thuê {entity.OrderNumber} - Khách nhận xe");

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin đơn thuê sau khi bắt đầu");
    }

    public async Task<RentalOrderDto> CompleteAsync(int id, DateTime? actualEndDate, string? returnLocation)
    {
        var entity = await _context.RentalOrders
            .Include(r => r.Vehicle)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn thuê với ID {id}");
        }

        if (entity.Status != RentalStatusConstants.InProgress)
        {
            throw new InvalidOperationException($"Không thể hoàn thành đơn thuê ở trạng thái {entity.Status}");
        }

        var oldStatus = entity.Status;
        entity.Status = RentalStatusConstants.Completed;
        entity.ActualEndDate = actualEndDate ?? DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(returnLocation))
        {
            entity.ReturnLocation = returnLocation;
        }
        entity.ModifiedDate = DateTime.UtcNow;

        // Update vehicle
        entity.Vehicle.Status = VehicleStatus.Available;
        entity.Vehicle.CurrentLocation = entity.ReturnLocation;

        await _repository.UpdateAsync(entity);

        // Create status history
        await CreateStatusHistoryAsync(entity.Id, oldStatus, entity.Status, "Khách trả xe");

        // Create vehicle history
        await CreateVehicleHistoryAsync(entity.VehicleId, VehicleHistoryAction.Returned, VehicleStatus.Rented, VehicleStatus.Available, entity.Id, "RentalOrder", $"Đơn thuê {entity.OrderNumber} - Khách trả xe");

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin đơn thuê sau khi hoàn thành");
    }

    public async Task<RentalOrderDto> CancelAsync(int id, string? reason)
    {
        var entity = await _context.RentalOrders
            .Include(r => r.Vehicle)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (entity == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn thuê với ID {id}");
        }

        if (entity.Status == RentalStatusConstants.Cancelled)
        {
            throw new InvalidOperationException("Đơn thuê đã bị hủy");
        }

        if (entity.Status == RentalStatusConstants.Invoiced)
        {
            throw new InvalidOperationException("Không thể hủy đơn thuê đã xuất hóa đơn");
        }

        var oldStatus = entity.Status;
        entity.Status = RentalStatusConstants.Cancelled;
        entity.ModifiedDate = DateTime.UtcNow;

        // Update vehicle if it was rented
        if (entity.Vehicle.Status == VehicleStatus.Rented && entity.VehicleId == entity.Vehicle.Id)
        {
            entity.Vehicle.Status = VehicleStatus.Available;
        }

        await _repository.UpdateAsync(entity);

        // Create status history
        await CreateStatusHistoryAsync(entity.Id, oldStatus, entity.Status, reason ?? "Hủy đơn thuê");

        // Create vehicle history if vehicle was rented
        if (oldStatus == RentalStatusConstants.InProgress || oldStatus == RentalStatusConstants.Confirmed)
        {
            await CreateVehicleHistoryAsync(entity.VehicleId, "RentalCancelled", VehicleStatus.Rented, VehicleStatus.Available, entity.Id, "RentalOrder", $"Hủy đơn thuê {entity.OrderNumber}");
        }

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Không thể lấy thông tin đơn thuê sau khi hủy");
    }

    public async Task<List<RentalStatusHistoryDto>> GetStatusHistoryAsync(int rentalOrderId)
    {
        var histories = await _context.RentalStatusHistories
            .Where(h => h.RentalOrderId == rentalOrderId)
            .OrderByDescending(h => h.ChangedDate)
            .Select(h => new RentalStatusHistoryDto
            {
                Id = h.Id,
                RentalOrderId = h.RentalOrderId,
                OldStatus = h.OldStatus,
                NewStatus = h.NewStatus,
                ChangedDate = h.ChangedDate,
                ChangedBy = h.ChangedBy,
                Notes = h.Notes
            })
            .ToListAsync();

        return histories;
    }

    private async Task CreateStatusHistoryAsync(int rentalOrderId, string? oldStatus, string newStatus, string? notes)
    {
        var history = new RentalStatusHistory
        {
            RentalOrderId = rentalOrderId,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            ChangedDate = DateTime.UtcNow,
            ChangedBy = null, // TODO: Get from current user context
            Notes = notes,
            CreatedDate = DateTime.UtcNow
        };

        _context.RentalStatusHistories.Add(history);
        await _context.SaveChangesAsync();
    }

    private async Task CreateVehicleHistoryAsync(int vehicleId, string actionType, string? oldStatus, string newStatus, int? referenceId, string? referenceType, string? description)
    {
        var history = new VehicleHistory
        {
            VehicleId = vehicleId,
            ActionType = actionType,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            Description = description,
            CreatedDate = DateTime.UtcNow
        };

        _context.VehicleHistories.Add(history);
        await _context.SaveChangesAsync();
    }
}
