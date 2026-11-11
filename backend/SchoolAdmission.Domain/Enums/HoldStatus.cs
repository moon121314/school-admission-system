using System.Text.Json.Serialization;

namespace SchoolAdmission.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum HoldStatus { HELD, CONFIRMED, EXPIRED, CANCELLED }