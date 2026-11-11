import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Edit3, Check, X, Inbox } from "lucide-react";
import {
  api,
  extractErrorMessage,
  listClasses,
  updateClass,
} from "../../api/client";
import type { ClassResponse } from "../../types/api";
import { useToast } from "../../contexts/ToastContext";

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
  const [search, setSearch] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSeats, setNewSeats] = useState(120);
  const [creating, setCreating] = useState(false);

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

  async function createClass(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      toast.warn("Enter a class name.");
      return;
    }
    if (newSeats < 1) {
      toast.warn("Seats must be at least 1.");
      return;
    }
    setCreating(true);
    try {
      await api.post("/classes", {
        name: newName.trim(),
        totalSeats: newSeats,
      });
      toast.success(`Created "${newName.trim()}" with ${newSeats} seats.`);
      setNewName("");
      setNewSeats(120);
      setShowCreate(false);
      refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy-900">Manage Classes</h2>
          <p className="text-sm text-navy-500">
            Update names and seat capacities. Seats cannot drop below current
            usage.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCreate((s) => !s)}
        >
          {showCreate ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> New class
            </>
          )}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createClass} className="card p-5">
          <h3 className="text-sm font-semibold text-navy-900 mb-3">
            Create a class
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input flex-1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Class 6 - Morning Shift"
              autoFocus
            />
            <input
              className="input sm:max-w-[130px]"
              type="number"
              min={1}
              value={newSeats}
              onChange={(e) => setNewSeats(Number(e.target.value))}
              placeholder="Total seats"
            />
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
        <input
          className="input pl-9"
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-50">
              <tr>
                {[
                  "Name",
                  "Total",
                  "Reserved",
                  "Confirmed",
                  "Available",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-navy-500 border-b border-navy-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="border-b border-navy-100">
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-40" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-10" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-10" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-10" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-10" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="skeleton h-4 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Inbox className="w-12 h-12 mx-auto text-navy-300 mb-3" />
                    <p className="text-base font-semibold text-navy-700">
                      {classes.length === 0 ? "No classes yet" : "No matches"}
                    </p>
                    <p className="text-sm text-navy-500 mt-1">
                      {classes.length === 0
                        ? "Click New class above to create the first one."
                        : `No class name matches "${search}".`}
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((c) => {
                  const isEditing = editing?.id === c.id;
                  const used = c.heldSeats + c.confirmedSeats;
                  const available = c.availableSeats;
                  const availClass =
                    available === 0
                      ? "text-danger-600 font-semibold"
                      : "text-success-600 font-semibold";

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-navy-100 hover:bg-navy-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            className="input"
                            value={editing.name}
                            onChange={(e) =>
                              setEditing({ ...editing, name: e.target.value })
                            }
                            autoFocus
                          />
                        ) : (
                          <span className="font-semibold text-navy-900">
                            {c.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            min={Math.max(1, used)}
                            className="input max-w-[90px] text-right tabular-nums"
                            value={editing.totalSeats}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                totalSeats: Number(e.target.value),
                              })
                            }
                          />
                        ) : (
                          <span className="text-navy-700">{c.totalSeats}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-navy-500">
                        {c.heldSeats}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-navy-500">
                        {c.confirmedSeats}
                      </td>
                      <td className={`px-4 py-3 tabular-nums ${availClass}`}>
                        {available}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="btn-primary text-xs px-2.5 py-1.5"
                              >
                                <Check className="w-3.5 h-3.5" /> Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="btn-secondary text-xs px-2.5 py-1.5"
                              >
                                <X className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(c)}
                              className="btn-secondary text-xs px-2.5 py-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filtered.length > 0 && search && (
        <p className="text-sm text-navy-500">
          Showing {filtered.length} of {classes.length} classes
        </p>
      )}
    </div>
  );
}
