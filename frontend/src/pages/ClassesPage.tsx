import { useEffect, useMemo, useState } from "react";
import { api, extractErrorMessage, listClasses } from "../api/client";
import type { ClassResponse } from "../types/api";
import { useStudentId } from "../hooks/useStudentId";
import { useToast } from "../contexts/ToastContext";
import { SkeletonCard } from "../components/Skeleton";
import { IconSearch, IconX, IconSchool } from "../components/Icons";

export function ClassesPage() {
  const { studentId } = useStudentId();
  const toast = useToast();
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

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

  async function apply(classId: number) {
    if (!studentId) {
      toast.warn("Enter your birth registration number at the top first.");
      return;
    }
    setApplying(classId);
    try {
      await api.post(`/classes/${classId}/holds`, null, {
        headers: { "X-Student-Id": studentId },
      });
      toast.success("Seat reserved. Open My Applications to confirm payment.");
      refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setApplying(null);
    }
  }

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, debounced]);

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Available Classes</h1>
          <p>
            Browse classes and reserve a seat. Holds expire after a short time.
          </p>
        </div>
        <div className="search-bar">
          <span className="search-bar__icon">
            <IconSearch size={16} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes..."
            aria-label="Search classes"
          />
          {search && (
            <button
              className="search-bar__clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="classes-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && classes.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <IconSchool size={56} />
          </div>
          <h3 className="empty__title">No classes yet</h3>
          <p className="empty__text">
            An administrator has not created any classes. Check the Admin tab.
          </p>
        </div>
      )}

      {!loading && classes.length > 0 && filtered.length === 0 && (
        <div className="empty">
          <h3 className="empty__title">No matches</h3>
          <p className="empty__text">
            No class name matches "{search}". Try a different search.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {debounced && (
            <p className="text-muted text-sm" style={{ margin: "0 0 12px" }}>
              Showing {filtered.length} of {classes.length} classes
            </p>
          )}
          <div className="classes-grid">
            {filtered.map((c) => {
              const used = c.heldSeats + c.confirmedSeats;
              const pct = Math.min(
                100,
                Math.round((used / Math.max(1, c.totalSeats)) * 100),
              );
              const isFull = c.availableSeats === 0;
              const progressClass = isFull
                ? "progress__bar--full"
                : pct >= 80
                  ? "progress__bar--warn"
                  : "";
              return (
                <div key={c.id} className="card class-card fade-in">
                  <div className="class-card__header">
                    <h3 className="class-card__name">{c.name}</h3>
                    <span
                      className={`badge ${isFull ? "badge--full" : pct >= 80 ? "badge--warn" : ""}`}
                    >
                      {isFull ? "Full" : `${pct}% filled`}
                    </span>
                  </div>

                  <div className="class-card__seats">
                    <div className="class-card__seats-main">
                      <span
                        className={`class-card__available ${isFull ? "class-card__available--full" : ""}`}
                      >
                        {c.availableSeats}
                      </span>
                      <span className="class-card__total">
                        of {c.totalSeats} available
                      </span>
                    </div>
                    <div className="class-card__stats">
                      <span>
                        Reserved: <strong>{c.heldSeats}</strong>
                      </span>
                      <span>
                        Confirmed: <strong>{c.confirmedSeats}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="progress">
                    <div
                      className={`progress__bar ${progressClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="class-card__action">
                    <button
                      className="btn btn--primary btn--block"
                      onClick={() => apply(c.id)}
                      disabled={isFull || applying === c.id}
                    >
                      {isFull
                        ? "Class full"
                        : applying === c.id
                          ? "Reserving..."
                          : "Apply"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
