using DriveNow.Common.Entities;

namespace DriveNow.Data.Entities;

public class Promotion : BaseMasterEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Percentage, FixedAmount
    public decimal Value { get; set; }
    public decimal? MinAmount { get; set; }
    public decimal? MaxDiscount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; } = 0;
}
