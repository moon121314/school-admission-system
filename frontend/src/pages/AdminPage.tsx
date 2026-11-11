import { useEffect, useState, type FormEvent } from "react";
import { api, extractErrorMessage, listClasses } from "../api/client";
import type { ClassResponse } from "../types/api";
import { Loading } from "../components/Loading";
import { EmptyState } from "../components/EmptyState";

export function AdminPage() {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(120);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
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

  async function createClass(e?: FormEvent) {
    e?.preventDefault();
    if (!name.trim() || seats < 1) {
      setError("Please provide a class name and a seat count of 1 or more.");
      return;
    }
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
    <>
      <div className="page-header">
        <h1>Manage Classes</h1>
        <p>Create classes and monitor seat availability in real time.</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="admin-form" onSubmit={createClass}>
        <h2 className="admin-form__title">Create a class</h2>
        <div className="admin-form__row">
          <input
            className="admin-form__input admin-form__input--name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Class 6 - Morning Shift"
          />
          <input
            className="admin-form__input admin-form__input--seats"
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </button>
        </div>
      </form>

      {loading && <Loading />}

      {!loading && classes.length === 0 && (
        <EmptyState
          icon="📋"
          title="No classes yet"
          text="Create the first class using the form above."
        />
      )}

      {!loading && classes.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total seats</th>
              <th>Reserved</th>
              <th>Confirmed</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td className="table__num">{c.totalSeats}</td>
                <td className="table__num table__num--muted">{c.heldSeats}</td>
                <td className="table__num table__num--muted">
                  {c.confirmedSeats}
                </td>
                <td
                  className={`table__num ${
                    c.availableSeats === 0
                      ? "table__num--available-zero"
                      : "table__num--available"
                  }`}
                >
                  {c.availableSeats}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
