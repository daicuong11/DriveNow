using Microsoft.EntityFrameworkCore;
using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.User;
using DriveNow.Business.Interfaces;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using DriveNow.Common.Extensions;

namespace DriveNow.Business.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UserDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.Users
            .Include(u => u.Employee)
            .Where(u => !u.IsDeleted);

        string? normalizedSearchTerm = null;
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            normalizedSearchTerm = request.SearchTerm.Trim().NormalizeForSearch();
        }

        if (!string.IsNullOrWhiteSpace(request.FilterRole))
        {
            query = query.Where(u => u.Role == request.FilterRole.Trim());
        }

        if (request.FilterIsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == request.FilterIsActive.Value);
        }

        var allItems = await query.ToListAsync();

        if (!string.IsNullOrWhiteSpace(normalizedSearchTerm))
        {
            allItems = allItems.Where(u =>
                u.Username.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                u.Email.NormalizeForSearch().Contains(normalizedSearchTerm) ||
                u.FullName.NormalizeForSearch().Contains(normalizedSearchTerm)
            ).ToList();
        }

        var sortedItems = request.SortBy?.ToLower() switch
        {
            "username" => request.SortDescending ? allItems.OrderByDescending(u => u.Username) : allItems.OrderBy(u => u.Username),
            "email" => request.SortDescending ? allItems.OrderByDescending(u => u.Email) : allItems.OrderBy(u => u.Email),
            "fullname" => request.SortDescending ? allItems.OrderByDescending(u => u.FullName) : allItems.OrderBy(u => u.FullName),
            "role" => request.SortDescending ? allItems.OrderByDescending(u => u.Role) : allItems.OrderBy(u => u.Role),
            "lastlogindate" => request.SortDescending ? allItems.OrderByDescending(u => u.LastLoginDate ?? DateTime.MinValue) : allItems.OrderBy(u => u.LastLoginDate ?? DateTime.MinValue),
            _ => allItems.OrderByDescending(u => u.CreatedDate)
        };

        var totalCount = sortedItems.Count();
        var pagedItems = sortedItems
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = pagedItems.Select(u => new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            FullName = u.FullName,
            Phone = u.Phone,
            Role = u.Role,
            IsActive = u.IsActive,
            IsLocked = u.IsLocked,
            LockedUntil = u.LockedUntil,
            LastLoginDate = u.LastLoginDate,
            FailedLoginAttempts = u.FailedLoginAttempts,
            EmployeeId = u.EmployeeId,
            EmployeeName = u.Employee?.FullName,
            CreatedDate = u.CreatedDate,
            CreatedBy = u.CreatedBy,
            ModifiedDate = u.ModifiedDate,
            ModifiedBy = u.ModifiedBy
        }).ToList();

        return new PagedResult<UserDto>
        {
            Data = dtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _context.Users
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            IsLocked = user.IsLocked,
            LockedUntil = user.LockedUntil,
            LastLoginDate = user.LastLoginDate,
            FailedLoginAttempts = user.FailedLoginAttempts,
            EmployeeId = user.EmployeeId,
            EmployeeName = user.Employee?.FullName,
            CreatedDate = user.CreatedDate,
            CreatedBy = user.CreatedBy,
            ModifiedDate = user.ModifiedDate,
            ModifiedBy = user.ModifiedBy
        };
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request)
    {
        // Check username uniqueness
        if (await _context.Users.AnyAsync(u => u.Username == request.Username && !u.IsDeleted))
        {
            throw new InvalidOperationException("Tên đăng nhập đã tồn tại");
        }

        // Check email uniqueness
        if (await _context.Users.AnyAsync(u => u.Email == request.Email && !u.IsDeleted))
        {
            throw new InvalidOperationException("Email đã tồn tại");
        }

        // Validate employee if provided
        if (request.EmployeeId.HasValue)
        {
            var employeeExists = await _context.Employees.AnyAsync(e => e.Id == request.EmployeeId.Value && !e.IsDeleted);
            if (!employeeExists)
            {
                throw new KeyNotFoundException("Nhân viên không tồn tại");
            }
        }

        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Phone = request.Phone?.Trim(),
            Role = request.Role,
            IsActive = request.IsActive,
            EmployeeId = request.EmployeeId,
            CreatedDate = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(user.Id) ?? throw new InvalidOperationException("Không thể tạo người dùng");
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null)
        {
            throw new KeyNotFoundException("Người dùng không tồn tại");
        }

        // Check email uniqueness (excluding current user)
        if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id && !u.IsDeleted))
        {
            throw new InvalidOperationException("Email đã tồn tại");
        }

        // Validate employee if provided
        if (request.EmployeeId.HasValue)
        {
            var employeeExists = await _context.Employees.AnyAsync(e => e.Id == request.EmployeeId.Value && !e.IsDeleted);
            if (!employeeExists)
            {
                throw new KeyNotFoundException("Nhân viên không tồn tại");
            }
        }

        user.Email = request.Email.Trim();
        user.FullName = request.FullName.Trim();
        user.Phone = request.Phone?.Trim();
        user.Role = request.Role;
        user.IsActive = request.IsActive;
        user.EmployeeId = request.EmployeeId;
        user.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id) ?? throw new InvalidOperationException("Không thể cập nhật người dùng");
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null)
        {
            throw new KeyNotFoundException("Người dùng không tồn tại");
        }

        user.IsDeleted = true;
        user.ModifiedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<UserDto> LockAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null)
        {
            throw new KeyNotFoundException("Người dùng không tồn tại");
        }

        user.IsLocked = true;
        user.LockedUntil = DateTime.UtcNow.AddDays(30); // Lock for 30 days
        await _context.SaveChangesAsync();

        // Reload with Employee navigation
        await _context.Entry(user).Reference(u => u.Employee).LoadAsync();
        return await GetByIdAsync(id) ?? throw new InvalidOperationException("Không thể lấy thông tin người dùng");
    }

    public async Task<UserDto> UnlockAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null)
        {
            throw new KeyNotFoundException("Người dùng không tồn tại");
        }

        user.IsLocked = false;
        user.LockedUntil = null;
        user.FailedLoginAttempts = 0;
        await _context.SaveChangesAsync();

        // Reload with Employee navigation
        await _context.Entry(user).Reference(u => u.Employee).LoadAsync();
        return await GetByIdAsync(id) ?? throw new InvalidOperationException("Không thể lấy thông tin người dùng");
    }

    public async Task<bool> ResetPasswordAsync(int id, ResetUserPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null)
        {
            throw new KeyNotFoundException("Người dùng không tồn tại");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ModifiedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }
}

