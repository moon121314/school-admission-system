import { useEffect, useState } from "react";
import { extractErrorMessage, listMyHolds } from "../api/client";
import type { MyHoldResponse } from "../types/api";
import { useStudentId } from "../hooks/useStudentId";
import { HoldCard } from "../components/HoldCard";
import { Loading } from "../components/Loading";
import { EmptyState } from "../components/EmptyState";

export function MyHoldsPage() {
  const { studentId } = useStudentId();
  const [holds, setHolds] = useState<MyHoldResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!studentId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setHolds(await listMyHolds(studentId));
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
  }, [studentId]);

  return (
    <>
      <div className="page-header">
        <h1>My Applications</h1>
        <p>Your seat reservations and confirmed admissions.</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {!studentId && (
        <div className="alert alert--info">
          Enter your 17-digit birth registration number at the top to view your
          applications.
        </div>
      )}

      {studentId && loading && <Loading />}

      {studentId && !loading && holds.length === 0 && (
        <EmptyState
          icon="📝"
          title="No applications yet"
          text="You haven't applied for any class. Open the Classes tab to get started."
        />
      )}

      {studentId &&
        holds.map((h) => (
          <HoldCard key={h.holdId} hold={h} onChange={refresh} />
        ))}
    </>
  );
}
