# Script to run migration and test
Write-Host "Building solution..." -ForegroundColor Yellow
dotnet build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host "Running database update..." -ForegroundColor Yellow
    cd DriveNow.API
    dotnet ef database update --project ../DriveNow.Data/DriveNow.Data.csproj
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database updated successfully!" -ForegroundColor Green
        Write-Host "Starting API..." -ForegroundColor Yellow
        dotnet run
    } else {
        Write-Host "Database update failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}

