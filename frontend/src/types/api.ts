export interface ClassResponse {
  id: number;
  name: string;
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
}

export type HoldStatus = "HELD" | "CONFIRMED" | "EXPIRED" | "CANCELLED";

export interface MyHoldResponse {
  holdId: number;
  classId: number;
  className: string;
  status: HoldStatus;
  expiresAt: string;
}
