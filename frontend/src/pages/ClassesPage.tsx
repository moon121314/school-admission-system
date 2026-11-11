import { useEffect, useState } from "react";
import { api, extractErrorMessage, listClasses } from "../api/client";
import type { ClassResponse } from "../types/api";
import { useStudentId } from "../hooks/useStudentId";

export function ClassesPage() {
  const { studentId } = useStudentId();
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      setClasses(await listClasses());
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  async function apply(classId: number) {
    if (!studentId) {
      setError("Enter your birth registration number above first.");
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await api.post(`/classes/${classId}/holds`, null, {
        headers: { "X-Student-Id": studentId },
      });
      setNotice("Seat held. Go to My Applications to confirm.");
      refresh();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  return (
    <div>
      <h1>Available Classes</h1>
      {notice && <p style={{ color: "green" }}>{notice}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && classes.length === 0 && <p>No classes yet.</p>}
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {classes.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "1rem",
            }}
          >
            <h3 style={{ marginTop: 0 }}>{c.name}</h3>
            <p>
              Available: <strong>{c.availableSeats}</strong> / {c.totalSeats}
            </p>
            <p style={{ fontSize: "0.85rem", color: "#666" }}>
              Held: {c.heldSeats} · Confirmed: {c.confirmedSeats}
            </p>
            <button
              onClick={() => apply(c.id)}
              disabled={c.availableSeats === 0}
            >
              {c.availableSeats === 0 ? "Class full" : "Apply"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
