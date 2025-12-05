using DriveNow.Business.DTOs.Auth;

namespace DriveNow.Business.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RefreshTokenAsync(string refreshToken);
    Task<string> ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
    Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    Task LogoutAsync(string refreshToken);
}

