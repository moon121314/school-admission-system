import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "error" in data) {
      return String(data.error);
    }
    if (error.response?.status === 409)
      return "Conflict — please review the form.";
    if (error.response?.status === 404) return "Not found.";
    if (error.response?.status === 400) return "Invalid input.";
    return error.message;
  }
  return "An unexpected error occurred.";
}

import type {
  ClassResponse,
  MyHoldResponse,
  AdminStatsResponse,
  AdminHoldRow,
  PagedResponse,
} from "../types/api";

export async function listClasses() {
  const { data } = await api.get<ClassResponse[]>("/classes");
  return data;
}

export async function listMyHolds(studentId: string) {
  const { data } = await api.get<MyHoldResponse[]>("/me/holds", {
    headers: { "X-Student-Id": studentId },
  });
  return data;
}

export async function updateClass(
  id: number,
  body: { name: string; totalSeats: number },
) {
  const { data } = await api.put<ClassResponse>(`/classes/${id}`, body);
  return data;
}

export async function getAdminStats() {
  const { data } = await api.get<AdminStatsResponse>("/admin/stats");
  return data;
}

export async function listAdminHolds(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  classId?: number;
}) {
  const { data } = await api.get<PagedResponse<AdminHoldRow>>("/admin/holds", {
    params,
  });
  return data;
}
