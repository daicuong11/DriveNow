using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace DriveNow.Common.Extensions;

public static class StringExtensions
{
    /// <summary>
    /// Removes Vietnamese diacritics (accents) from a string
    /// Example: "Nguyễn" -> "Nguyen", "Đỗ" -> "Do"
    /// </summary>
    public static string RemoveVietnameseDiacritics(this string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return text;

        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
    }

    /// <summary>
    /// Normalizes a string for search: removes diacritics, converts to lowercase, trims whitespace
    /// </summary>
    public static string NormalizeForSearch(this string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        return text.Trim().RemoveVietnameseDiacritics().ToLowerInvariant();
    }

    /// <summary>
    /// Checks if a string contains the search term (case-insensitive, diacritic-insensitive)
    /// </summary>
    public static bool ContainsIgnoreCaseAndDiacritics(this string source, string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(source) || string.IsNullOrWhiteSpace(searchTerm))
            return false;

        var normalizedSource = source.NormalizeForSearch();
        var normalizedSearchTerm = searchTerm.NormalizeForSearch();

        return normalizedSource.Contains(normalizedSearchTerm);
    }
}

