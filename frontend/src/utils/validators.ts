/**
 * Client-side validators.
 *
 * These mirror backend limits so the user sees errors instantly.
 * The backend remains authoritative — if these somehow pass but the
 * backend rejects, the API error is still shown (nothing bypasses here).
 */

export const LIMITS = {
  NAME_MIN: 1,
  NAME_MAX: 200,
  SEATS_MIN: 1,
  SEATS_MAX: 2000,
} as const;

export interface ValidationResult {
  ok: boolean;
  nameError?: string;
  seatsError?: string;
}

export function validateClassForm(
  name: string,
  totalSeats: number,
): ValidationResult {
  const trimmed = name.trim();
  const nameError =
    trimmed.length === 0
      ? "Class name is required."
      : trimmed.length > LIMITS.NAME_MAX
        ? `Class name must be ${LIMITS.NAME_MAX} characters or fewer.`
        : undefined;

  const seatsError =
    !Number.isFinite(totalSeats) || !Number.isInteger(totalSeats)
      ? "Seats must be a whole number."
      : totalSeats < LIMITS.SEATS_MIN
        ? `Seats must be at least ${LIMITS.SEATS_MIN}.`
        : totalSeats > LIMITS.SEATS_MAX
          ? `Seats must be ${LIMITS.SEATS_MAX} or fewer.`
          : undefined;

  return { ok: !nameError && !seatsError, nameError, seatsError };
}

export function sanitizeStudentId(raw: string): string {
  return raw.replace(/[^0-9]/g, "").slice(0, 17);
}

export function maskStudentId(id: string | null | undefined): string {
  if (!id) return "";
  if (id.length < 8) return id;
  return `${id.slice(0, 2)}${"*".repeat(id.length - 6)}${id.slice(-4)}`;
}
