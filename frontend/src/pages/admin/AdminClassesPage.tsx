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
import { validateClassForm, LIMITS } from "../../utils/validators";

interface EditingState {
  id: number;
  name: string;
  totalSeats: number;
  nameError?: string;
  seatsError?: string;
}

export function AdminClassesPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Create form state with inline errors
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSeats, setNewSeats] = useState(120);
  const [createErrors, setCreateErrors] = useState<{
    nameError?: string;
    seatsError?: string;
  }>({});
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
    const validation = validateClassForm(newName, newSeats);
    if (!validation.ok) {
      setCreateErrors({
        nameError: validation.nameError,
        seatsError: validation.seatsError,
      });
      return;
    }
    setCreateErrors({});
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
    const validation = validateClassForm(editing.name, editing.totalSeats);
    if (!validation.ok) {
      setEditing({
        ...editing,
        nameError: validation.nameError,
        seatsError: validation.seatsError,
      });
      return;
    }
    const target = classes.find((c) => c.id === editing.id);
    const used = (target?.heldSeats ?? 0) + (target?.confirmedSeats ?? 0);
    if (editing.totalSeats < used) {
      setEditing({
        ...editing,
        seatsError: `Cannot reduce below ${used} — those seats are in use.`,
      });
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
        <form onSubmit={createClass} className="card p-5" noValidate>
          <h3 className="text-sm font-semibold text-navy-900 mb-3">
            Create a class
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 min-w-0">
              <input
                className={`input w-full ${
                  createErrors.nameError
                    ? "border-danger-300 focus:border-danger-500"
                    : ""
                }`}
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (createErrors.nameError)
                    setCreateErrors({ ...createErrors, nameError: undefined });
                }}
                placeholder="e.g. Class 6 - Morning Shift"
                maxLength={LIMITS.NAME_MAX}
                autoFocus
              />
              {createErrors.nameError && (
                <p className="text-xs text-danger-600 mt-1">
                  {createErrors.nameError}
                </p>
              )}
            </div>
            <div className="sm:max-w-[140px]">
              <input
                className={`input w-full ${
                  createErrors.seatsError
                    ? "border-danger-300 focus:border-danger-500"
                    : ""
                }`}
                type="number"
                min={LIMITS.SEATS_MIN}
                max={LIMITS.SEATS_MAX}
                value={newSeats}
                onChange={(e) => {
                  setNewSeats(Number(e.target.value));
                  if (createErrors.seatsError)
                    setCreateErrors({ ...createErrors, seatsError: undefined });
                }}
                placeholder="Total seats"
              />
              {createErrors.seatsError && (
                <p className="text-xs text-danger-600 mt-1">
                  {createErrors.seatsError}
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
          <p className="text-xs text-navy-400 mt-2">
            Seat capacity must be between {LIMITS.SEATS_MIN} and{" "}
            {LIMITS.SEATS_MAX}.
          </p>
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
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="skeleton h-4 w-full max-w-[80px]" />
                        </td>
                      ))}
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
                          <div>
                            <input
                              className={`input ${
                                editing.nameError ? "border-danger-300" : ""
                              }`}
                              value={editing.name}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  name: e.target.value,
                                  nameError: undefined,
                                })
                              }
                              maxLength={LIMITS.NAME_MAX}
                              autoFocus
                            />
                            {editing.nameError && (
                              <p className="text-xs text-danger-600 mt-1">
                                {editing.nameError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="font-semibold text-navy-900">
                            {c.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {isEditing ? (
                          <div>
                            <input
                              type="number"
                              min={Math.max(1, used)}
                              max={LIMITS.SEATS_MAX}
                              className={`input max-w-[90px] text-right tabular-nums ${
                                editing.seatsError ? "border-danger-300" : ""
                              }`}
                              value={editing.totalSeats}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  totalSeats: Number(e.target.value),
                                  seatsError: undefined,
                                })
                              }
                            />
                            {editing.seatsError && (
                              <p className="text-xs text-danger-600 mt-1 whitespace-nowrap">
                                {editing.seatsError}
                              </p>
                            )}
                          </div>
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
