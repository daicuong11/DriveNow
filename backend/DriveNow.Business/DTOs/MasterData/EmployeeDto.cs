namespace DriveNow.Business.DTOs.MasterData;

public class EmployeeDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public DateTime? HireDate { get; set; }
    public string Status { get; set; } = "A";
}

public class CreateEmployeeRequest
{
    public string Code { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public DateTime? HireDate { get; set; }
    public string Status { get; set; } = "A";
}

public class UpdateEmployeeRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public DateTime? HireDate { get; set; }
    public string Status { get; set; } = "A";
}

