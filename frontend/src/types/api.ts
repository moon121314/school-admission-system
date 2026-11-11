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

export interface AdminStatsResponse {
  totalClasses: number;
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
  expiringSoon: number;
  totalHolds: number;
}

export interface AdminHoldRow {
  holdId: number;
  classId: number;
  className: string;
  studentId: string;
  status: HoldStatus;
  createdAt: string;
  expiresAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
