import { useEffect, useState } from "react";
import { api, extractErrorMessage, listClasses } from "../api/client";
import type { ClassResponse } from "../types/api";
import { useStudentId } from "../hooks/useStudentId";
import { Loading } from "../components/Loading";
import { EmptyState } from "../components/EmptyState";

export function ClassesPage() {
  const { studentId } = useStudentId();
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [applying, setApplying] = useState<number | null>(null);

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
      setError("Enter your birth registration number at the top first.");
      return;
    }
    setError(null);
    setNotice(null);
    setApplying(classId);
    try {
      await api.post(`/classes/${classId}/holds`, null, {
        headers: { "X-Student-Id": studentId },
      });
      setNotice("Seat reserved. Open My Applications to confirm payment.");
      refresh();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setApplying(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Available Classes</h1>
        <p>
          Browse classes and reserve a seat. Holds expire after a short time.
        </p>
      </div>

      {notice && <div className="alert alert--success">{notice}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {loading && <Loading />}

      {!loading && classes.length === 0 && (
        <EmptyState
          icon="🏫"
          title="No classes yet"
          text="An administrator has not created any classes. Check back soon."
        />
      )}

      {!loading && classes.length > 0 && (
        <div className="classes-grid">
          {classes.map((c) => {
            const used = c.heldSeats + c.confirmedSeats;
            const pct = Math.min(
              100,
              Math.round((used / Math.max(1, c.totalSeats)) * 100),
            );
            const isFull = c.availableSeats === 0;
            return (
              <div key={c.id} className="class-card">
                <div className="class-card__header">
                  <h3 className="class-card__name">{c.name}</h3>
                  <span
                    className={`class-card__badge ${
                      isFull ? "class-card__badge--full" : ""
                    }`}
                  >
                    {isFull ? "Full" : `${pct}% filled`}
                  </span>
                </div>

                <div className="class-card__seats">
                  <div className="class-card__seats-main">
                    <span className="class-card__available">
                      {c.availableSeats}
                    </span>
                    <span className="class-card__total">
                      of {c.totalSeats} seats available
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

                <div className="class-card__progress">
                  <div
                    className={`class-card__progress-bar ${
                      isFull ? "class-card__progress-bar--full" : ""
                    }`}
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
      )}
    </>
  );
}
