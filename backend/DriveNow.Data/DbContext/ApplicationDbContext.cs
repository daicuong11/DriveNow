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
    public DbSet<Promotion> Promotions { get; set; }

    // Business Entities
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<RentalOrder> RentalOrders { get; set; }
    public DbSet<RentalStatusHistory> RentalStatusHistories { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceDetail> InvoiceDetails { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<VehicleInOut> VehicleInOuts { get; set; }
    public DbSet<VehicleMaintenance> VehicleMaintenances { get; set; }
    public DbSet<VehicleHistory> VehicleHistories { get; set; }

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

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Value).HasPrecision(18, 2);
            entity.Property(e => e.MinAmount).HasPrecision(18, 2);
            entity.Property(e => e.MaxDiscount).HasPrecision(18, 2);
        });

        // Business Entities - Configure foreign keys to avoid cascade conflicts
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.HasIndex(e => e.RentalOrderId).IsUnique();
            
            entity.HasOne(e => e.Customer)
                  .WithMany(e => e.Invoices)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RentalOrder)
                  .WithMany()
                  .HasForeignKey(e => e.RentalOrderId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Configure decimal precision for money fields
            entity.Property(e => e.SubTotal).HasPrecision(18, 2);
            entity.Property(e => e.TaxRate).HasPrecision(5, 2);
            entity.Property(e => e.TaxAmount).HasPrecision(18, 2);
            entity.Property(e => e.DiscountAmount).HasPrecision(18, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.PaidAmount).HasPrecision(18, 2);
            entity.Property(e => e.RemainingAmount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<InvoiceDetail>(entity =>
        {
            entity.HasOne(e => e.Invoice)
                  .WithMany(e => e.InvoiceDetails)
                  .HasForeignKey(e => e.InvoiceId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Configure decimal precision
            entity.Property(e => e.Quantity).HasPrecision(18, 2);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasIndex(e => e.PaymentNumber).IsUnique();
            
            entity.HasOne(e => e.Invoice)
                  .WithMany(e => e.Payments)
                  .HasForeignKey(e => e.InvoiceId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Configure decimal precision
            entity.Property(e => e.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<RentalOrder>(entity =>
        {
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            
            entity.HasOne(e => e.Customer)
                  .WithMany(e => e.RentalOrders)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Vehicle)
                  .WithMany(e => e.RentalOrders)
                  .HasForeignKey(e => e.VehicleId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Employee)
                  .WithMany(e => e.RentalOrders)
                  .HasForeignKey(e => e.EmployeeId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Configure decimal precision for money fields
            entity.Property(e => e.DailyRentalPrice).HasPrecision(18, 2);
            entity.Property(e => e.SubTotal).HasPrecision(18, 2);
            entity.Property(e => e.DiscountAmount).HasPrecision(18, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.DepositAmount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<RentalStatusHistory>(entity =>
        {
            entity.HasOne(e => e.RentalOrder)
                  .WithMany(e => e.StatusHistories)
                  .HasForeignKey(e => e.RentalOrderId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.LicensePlate).IsUnique();
            entity.HasIndex(e => e.ChassisNumber).IsUnique().HasFilter("[ChassisNumber] IS NOT NULL");
            
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

            // Configure decimal precision for DailyRentalPrice
            entity.Property(e => e.DailyRentalPrice)
                  .HasPrecision(18, 2);
        });

        modelBuilder.Entity<VehicleInOut>(entity =>
        {
            entity.HasOne(e => e.Vehicle)
                  .WithMany(e => e.VehicleInOuts)
                  .HasForeignKey(e => e.VehicleId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Employee)
                  .WithMany(e => e.VehicleInOuts)
                  .HasForeignKey(e => e.EmployeeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<VehicleMaintenance>(entity =>
        {
            entity.HasOne(e => e.Vehicle)
                  .WithMany()
                  .HasForeignKey(e => e.VehicleId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Configure decimal precision for Cost
            entity.Property(e => e.Cost)
                  .HasPrecision(18, 2);
        });

        modelBuilder.Entity<VehicleHistory>(entity =>
        {
            entity.HasOne(e => e.Vehicle)
                  .WithMany()
                  .HasForeignKey(e => e.VehicleId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

