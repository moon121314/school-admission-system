using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolAdmission.Domain.Entities;

namespace SchoolAdmission.Infrastructure.Configurations;

public class AdmissionHoldConfiguration : IEntityTypeConfiguration<AdmissionHold>
{
    public void Configure(EntityTypeBuilder<AdmissionHold> builder)
    {
        builder.ToTable("admission_holds");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.StudentId).IsRequired().HasMaxLength(17).IsFixedLength();
        builder.Property(h => h.Status).IsRequired().HasConversion<string>().HasMaxLength(20);
        builder.Property(h => h.CreatedAt).IsRequired();
        builder.Property(h => h.ExpiresAt).IsRequired();

        builder.HasIndex(h => new { h.ClassId, h.Status })
            .HasDatabaseName("ix_admission_holds_class_status");
        builder.HasIndex(h => h.StudentId)
            .HasDatabaseName("ix_admission_holds_student_id");
        builder.HasIndex(h => new { h.Status, h.ExpiresAt })
            .HasDatabaseName("ix_admission_holds_status_expires_at");

        builder.HasIndex(h => new { h.ClassId, h.StudentId })
            .HasDatabaseName("ux_admission_holds_class_student_active")
            .HasFilter("\"Status\" IN ('HELD', 'CONFIRMED')")
            .IsUnique();
    }
}