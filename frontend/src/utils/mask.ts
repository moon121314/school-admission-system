/**
 * Mask a 17-digit birth registration number for display.
 * Keeps first 2 and last 4 digits visible, masks the middle 11.
 * Example: "20152691234567890" → "20***********7890"
 */
export function maskStudentId(id: string | null | undefined): string {
  if (!id) return "";
  if (id.length < 8) return id;
  return `${id.slice(0, 2)}${"*".repeat(id.length - 6)}${id.slice(-4)}`;
}
