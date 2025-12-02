namespace DriveNow.Business.DTOs.MasterData;

public class ExportExcelRequest
{
    public List<int> Ids { get; set; } = new(); // Empty list = export all
}

