import { useEffect, useState } from "react";
import {
  extractErrorMessage,
  listClasses,
  updateClass,
} from "../../api/client";
import type { ClassResponse } from "../../types/api";
import { useToast } from "../../contexts/ToastContext";
import { SkeletonRow } from "../../components/Skeleton";
import { IconInbox, IconCheck, IconX } from "../../components/Icons";

interface EditingState {
  id: number;
  name: string;
  totalSeats: number;
}

export function AdminClassesPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);

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
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  function startEdit(c: ClassResponse) {
    setEditing({ id: c.id, name: c.name, totalSeats: c.totalSeats });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;
    const target = classes.find((c) => c.id === editing.id);
    if (!target) return;

    const used = target.heldSeats + target.confirmedSeats;
    if (editing.totalSeats < used) {
      toast.warn(
        `Cannot reduce below ${used} seat(s) — those are already in use.`,
      );
      return;
    }
    if (editing.name.trim().length === 0) {
      toast.warn("Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await updateClass(editing.id, {
        name: editing.name.trim(),
        totalSeats: editing.totalSeats,
      });
      toast.success(`Updated "${editing.name.trim()}".`);
      setEditing(null);
      refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Manage Classes</h1>
          <p>
            Update class names and seat capacities. Total seats cannot drop
            below current usage.
          </p>
        </div>
      </div>

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
                <th></th>
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
          <p className="empty__text">Create one from the Classes tab.</p>
        </div>
      )}

      {!loading && classes.length > 0 && (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Total</th>
                <th>Reserved</th>
                <th>Confirmed</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const isEditing = editing?.id === c.id;
                const used = c.heldSeats + c.confirmedSeats;
                return (
                  <tr key={c.id}>
                    <td>
                      {isEditing ? (
                        <input
                          className="inline-edit-input"
                          value={editing.name}
                          onChange={(e) =>
                            setEditing({ ...editing, name: e.target.value })
                          }
                          autoFocus
                        />
                      ) : (
                        <strong>{c.name}</strong>
                      )}
                    </td>
                    <td className="table__num">
                      {isEditing ? (
                        <input
                          className="inline-edit-input inline-edit-input--num"
                          type="number"
                          min={Math.max(1, used)}
                          value={editing.totalSeats}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              totalSeats: Number(e.target.value),
                            })
                          }
                        />
                      ) : (
                        c.totalSeats
                      )}
                    </td>
                    <td className="table__num table__num--muted">
                      {c.heldSeats}
                    </td>
                    <td className="table__num table__num--muted">
                      {c.confirmedSeats}
                    </td>
                    <td
                      className={`table__num ${
                        c.availableSeats === 0
                          ? "table__num--bad"
                          : "table__num--good"
                      }`}
                    >
                      {c.availableSeats}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="table__actions">
                          <button
                            className="btn btn--primary btn--sm"
                            onClick={saveEdit}
                            disabled={saving}
                          >
                            <IconCheck size={14} /> Save
                          </button>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            <IconX size={14} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => startEdit(c)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
