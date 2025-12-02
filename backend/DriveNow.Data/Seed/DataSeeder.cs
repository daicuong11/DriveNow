using DriveNow.Common.Constants;
using DriveNow.Data.DbContext;
using DriveNow.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace DriveNow.Data.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Seed Admin User
        if (!await context.Users.AnyAsync(u => u.Username == "admin"))
        {
            var adminUser = new User
            {
                Username = "admin",
                Email = "admin@drivenow.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FullName = "Administrator",
                Role = RoleConstants.Admin, // Full access to all features
                IsActive = true,
                IsLocked = false,
                FailedLoginAttempts = 0,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "System",
                IsDeleted = false
            };

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
        }

        // Seed Employee User
        if (!await context.Users.AnyAsync(u => u.Username == "employee"))
        {
            var employeeUser = new User
            {
                Username = "employee",
                Email = "employee@drivenow.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
                FullName = "Employee User",
                Role = RoleConstants.Employee, // Limited access - cannot manage users or system config
                IsActive = true,
                IsLocked = false,
                FailedLoginAttempts = 0,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "System",
                IsDeleted = false
            };

            context.Users.Add(employeeUser);
            await context.SaveChangesAsync();
        }

        // Seed Vehicle Types
        if (!await context.VehicleTypes.AnyAsync())
        {
            var vehicleTypes = new[]
            {
                new VehicleType { Code = "SEDAN", Name = "Sedan", Description = "Xe sedan", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleType { Code = "SUV", Name = "SUV", Description = "Xe SUV", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleType { Code = "HATCHBACK", Name = "Hatchback", Description = "Xe hatchback", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleType { Code = "COUPE", Name = "Coupe", Description = "Xe coupe", Status = "A", CreatedDate = DateTime.UtcNow },
            };

            context.VehicleTypes.AddRange(vehicleTypes);
            await context.SaveChangesAsync();
        }

        // Seed Vehicle Brands
        if (!await context.VehicleBrands.AnyAsync())
        {
            var vehicleBrands = new[]
            {
                new VehicleBrand { Code = "TOYOTA", Name = "Toyota", Country = "Japan", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleBrand { Code = "HONDA", Name = "Honda", Country = "Japan", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleBrand { Code = "FORD", Name = "Ford", Country = "USA", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleBrand { Code = "BMW", Name = "BMW", Country = "Germany", Status = "A", CreatedDate = DateTime.UtcNow },
            };

            context.VehicleBrands.AddRange(vehicleBrands);
            await context.SaveChangesAsync();
        }

        // Seed Vehicle Colors
        if (!await context.VehicleColors.AnyAsync())
        {
            var vehicleColors = new[]
            {
                new VehicleColor { Code = "RED", Name = "Đỏ", HexCode = "#FF0000", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleColor { Code = "BLUE", Name = "Xanh dương", HexCode = "#0000FF", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleColor { Code = "BLACK", Name = "Đen", HexCode = "#000000", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleColor { Code = "WHITE", Name = "Trắng", HexCode = "#FFFFFF", Status = "A", CreatedDate = DateTime.UtcNow },
                new VehicleColor { Code = "SILVER", Name = "Bạc", HexCode = "#C0C0C0", Status = "A", CreatedDate = DateTime.UtcNow },
            };

            context.VehicleColors.AddRange(vehicleColors);
            await context.SaveChangesAsync();
        }
    }
}

