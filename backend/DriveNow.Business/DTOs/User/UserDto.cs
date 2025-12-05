namespace DriveNow.Business.DTOs.User;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "Employee";
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; } = false;
    public DateTime? LockedUntil { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public int? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "Employee";
    public bool IsActive { get; set; } = true;
    public int? EmployeeId { get; set; }
}

public class UpdateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "Employee";
    public bool IsActive { get; set; } = true;
    public int? EmployeeId { get; set; }
}

public class ResetUserPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}

