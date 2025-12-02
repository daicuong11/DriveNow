namespace DriveNow.Business.DTOs.Common;

public class PagedRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
    
    // Advanced filters - filter by specific columns
    public string? FilterCode { get; set; }
    public string? FilterName { get; set; }
    public string? FilterStatus { get; set; }
    public string? FilterCountry { get; set; }
    public string? FilterDescription { get; set; }
}

