using Microsoft.EntityFrameworkCore;
using DriveNow.Common.Entities;
using DriveNow.Data.Entities;

namespace DriveNow.Data.DbContext;

public class ApplicationDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public ApplicationDbContext(Microsoft.EntityFrameworkCore.DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Authentication & Authorization
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    // Master Data
    public DbSet<VehicleType> VehicleTypes { get; set; }
    public DbSet<VehicleBrand> VehicleBrands { get; set; }
    public DbSet<VehicleColor> VehicleColors { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<SystemConfig> SystemConfigs { get; set; }

    // Business Entities
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<RentalOrder> RentalOrders { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<VehicleInOut> VehicleInOuts { get; set; }

    protected override void OnModelCreating(Microsoft.EntityFrameworkCore.ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasOne(e => e.Employee)
                  .WithMany(e => e.Users)
                  .HasForeignKey(e => e.EmployeeId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.User)
                  .WithMany(e => e.RefreshTokens)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PasswordResetToken configuration
        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.User)
                  .WithMany(e => e.PasswordResetTokens)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Master Data - Unique constraints
        modelBuilder.Entity<VehicleType>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<VehicleBrand>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<VehicleColor>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.IdentityCard).IsUnique();
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<SystemConfig>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Business Entities - Configure foreign keys to avoid cascade conflicts
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasOne(e => e.Customer)
                  .WithMany(e => e.Invoices)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RentalOrder)
                  .WithMany()
                  .HasForeignKey(e => e.RentalOrderId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Configure decimal precision for money fields
            entity.Property(e => e.TotalAmount)
                  .HasPrecision(18, 2);

            entity.Property(e => e.PaidAmount)
                  .HasPrecision(18, 2);
        });

        modelBuilder.Entity<RentalOrder>(entity =>
        {
            entity.HasOne(e => e.Customer)
                  .WithMany(e => e.RentalOrders)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Vehicle)
                  .WithMany()
                  .HasForeignKey(e => e.VehicleId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Employee)
                  .WithMany(e => e.RentalOrders)
                  .HasForeignKey(e => e.EmployeeId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasOne(e => e.VehicleType)
                  .WithMany(e => e.Vehicles)
                  .HasForeignKey(e => e.VehicleTypeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.VehicleBrand)
                  .WithMany(e => e.Vehicles)
                  .HasForeignKey(e => e.VehicleBrandId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.VehicleColor)
                  .WithMany(e => e.Vehicles)
                  .HasForeignKey(e => e.VehicleColorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<VehicleInOut>(entity =>
        {
            entity.HasOne(e => e.Vehicle)
                  .WithMany()
                  .HasForeignKey(e => e.VehicleId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Employee)
                  .WithMany(e => e.VehicleInOuts)
                  .HasForeignKey(e => e.EmployeeId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}

