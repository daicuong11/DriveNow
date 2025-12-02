namespace DriveNow.Business.DTOs.MasterData;

public class ImportExcelResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<ImportError> Errors { get; set; } = new();
    public int TotalRows { get; set; }
    public int SuccessCount { get; set; }
}

public class ImportError
{
    public int Row { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Field { get; set; }
}

