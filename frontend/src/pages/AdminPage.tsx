import { useEffect, useState } from "react";
import { api, extractErrorMessage, listClasses } from "../api/client";
import type { ClassResponse } from "../types/api";

export function AdminPage() {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(120);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      setClasses(await listClasses());
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  async function createClass() {
    setError(null);
    setBusy(true);
    try {
      await api.post("/classes", { name: name.trim(), totalSeats: seats });
      setName("");
      setSeats(120);
      refresh();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Admin — Manage Classes</h1>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Class name (e.g. Class 6 - Morning Shift)"
          style={{ flex: 1, padding: "0.4rem" }}
        />
        <input
          type="number"
          min={1}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          style={{ width: "6rem", padding: "0.4rem" }}
        />
        <button onClick={createClass} disabled={busy || !name.trim()}>
          Create
        </button>
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Name</th>
            <th>Total</th>
            <th>Held</th>
            <th>Confirmed</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{c.name}</td>
              <td>{c.totalSeats}</td>
              <td>{c.heldSeats}</td>
              <td>{c.confirmedSeats}</td>
              <td>{c.availableSeats}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
