using DriveNow.Business.DTOs.Common;
using DriveNow.Business.DTOs.User;

namespace DriveNow.Business.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserDto>> GetPagedAsync(PagedRequest request);
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto> CreateAsync(CreateUserRequest request);
    Task<UserDto> UpdateAsync(int id, UpdateUserRequest request);
    Task<bool> DeleteAsync(int id);
    Task<bool> LockAsync(int id);
    Task<bool> UnlockAsync(int id);
    Task<bool> ResetPasswordAsync(int id, ResetUserPasswordRequest request);
}

