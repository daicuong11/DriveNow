namespace DriveNow.Common.Entities;

public abstract class BaseMasterEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = "A"; // A = Active, I = InActive
}

