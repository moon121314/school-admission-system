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
    if (error.response?.status === 409) return "The class is full.";
    if (error.response?.status === 404) return "Not found.";
    if (error.response?.status === 400) return "Invalid input.";
    return error.message;
  }
  return "An unexpected error occurred.";
}

export async function listClasses() {
  const { data } =
    await api.get<import("../types/api").ClassResponse[]>("/classes");
  return data;
}

export async function listMyHolds(studentId: string) {
  const { data } = await api.get<import("../types/api").MyHoldResponse[]>(
    "/me/holds",
    { headers: { "X-Student-Id": studentId } },
  );
  return data;
}
