namespace SchoolAdmission.Domain.Entities;

public class AdmissionClass
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<AdmissionHold> Holds { get; set; } = new List<AdmissionHold>();
}