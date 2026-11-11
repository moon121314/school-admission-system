import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, extractErrorMessage, listClasses } from "../api/client";
import type { ClassResponse } from "../types/api";
import { useToast } from "../contexts/ToastContext";
import { SkeletonRow } from "../components/Skeleton";
import {
  IconSort,
  IconSortAsc,
  IconSortDesc,
  IconInbox,
} from "../components/Icons";

type SortKey =
  | "id"
  | "name"
  | "totalSeats"
  | "heldSeats"
  | "confirmedSeats"
  | "availableSeats";
type SortDir = "asc" | "desc";

export function AdminPage() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(120);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  async function refresh() {
    try {
      setClasses(await listClasses());
    } catch (e) {
      toast.error(extractErrorMessage(e));
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
      toast.warn("Provide a name and seat count of 1 or more.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/classes", { name: name.trim(), totalSeats: seats });
      toast.success(`Created "${name.trim()}" with ${seats} seats.`);
      setName("");
      setSeats(120);
      refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...classes];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return copy;
  }, [classes, sortKey, sortDir]);

  const stats = useMemo(() => {
    return classes.reduce(
      (acc, c) => ({
        classes: acc.classes + 1,
        total: acc.total + c.totalSeats,
        reserved: acc.reserved + c.heldSeats,
        confirmed: acc.confirmed + c.confirmedSeats,
        available: acc.available + c.availableSeats,
      }),
      { classes: 0, total: 0, reserved: 0, confirmed: 0, available: 0 },
    );
  }, [classes]);

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <IconSort size={12} />;
    return sortDir === "asc" ? (
      <IconSortAsc size={12} />
    ) : (
      <IconSortDesc size={12} />
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Manage Classes</h1>
          <p>Create classes and monitor seat availability in real time.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={createClass}>
        <h2 className="form-card__title">Create a class</h2>
        <div className="form-row">
          <input
            className="input input--grow"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Class 6 - Morning Shift"
            aria-label="Class name"
          />
          <input
            className="input input--short"
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            aria-label="Total seats"
          />
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Creating..." : "Create class"}
          </button>
        </div>
      </form>

      {!loading && classes.length > 0 && (
        <div className="stats">
          <div className="stat">
            <div className="stat__label">Classes</div>
            <div className="stat__value stat__value--primary">
              {stats.classes}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">Total seats</div>
            <div className="stat__value">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="stat__label">Reserved</div>
            <div className="stat__value stat__value--warning">
              {stats.reserved}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">Confirmed</div>
            <div className="stat__value stat__value--success">
              {stats.confirmed}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">Available</div>
            <div className="stat__value stat__value--primary">
              {stats.available}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Total</th>
                <th>Reserved</th>
                <th>Confirmed</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        </div>
      )}

      {!loading && classes.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <IconInbox size={56} />
          </div>
          <h3 className="empty__title">No classes yet</h3>
          <p className="empty__text">
            Create the first class using the form above.
          </p>
        </div>
      )}

      {!loading && classes.length > 0 && (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th
                  className={`sortable ${sortKey === "name" ? "active" : ""}`}
                  onClick={() => toggleSort("name")}
                >
                  Name{" "}
                  <span className="table__sort-icon">{sortIcon("name")}</span>
                </th>
                <th
                  className={`sortable ${sortKey === "totalSeats" ? "active" : ""}`}
                  onClick={() => toggleSort("totalSeats")}
                >
                  Total{" "}
                  <span className="table__sort-icon">
                    {sortIcon("totalSeats")}
                  </span>
                </th>
                <th
                  className={`sortable ${sortKey === "heldSeats" ? "active" : ""}`}
                  onClick={() => toggleSort("heldSeats")}
                >
                  Reserved{" "}
                  <span className="table__sort-icon">
                    {sortIcon("heldSeats")}
                  </span>
                </th>
                <th
                  className={`sortable ${sortKey === "confirmedSeats" ? "active" : ""}`}
                  onClick={() => toggleSort("confirmedSeats")}
                >
                  Confirmed{" "}
                  <span className="table__sort-icon">
                    {sortIcon("confirmedSeats")}
                  </span>
                </th>
                <th
                  className={`sortable ${sortKey === "availableSeats" ? "active" : ""}`}
                  onClick={() => toggleSort("availableSeats")}
                >
                  Available{" "}
                  <span className="table__sort-icon">
                    {sortIcon("availableSeats")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td className="table__num">{c.totalSeats}</td>
                  <td className="table__num table__num--muted">
                    {c.heldSeats}
                  </td>
                  <td className="table__num table__num--muted">
                    {c.confirmedSeats}
                  </td>
                  <td
                    className={`table__num ${c.availableSeats === 0 ? "table__num--bad" : "table__num--good"}`}
                  >
                    {c.availableSeats}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
