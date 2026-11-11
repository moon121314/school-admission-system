import { useEffect, useState } from "react";
import { extractErrorMessage, listMyHolds } from "../api/client";
import type { MyHoldResponse } from "../types/api";
import { useStudentId } from "../hooks/useStudentId";
import { HoldCard } from "../components/HoldCard";

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

  if (!studentId)
    return (
      <p>
        Enter your birth registration number above to see your applications.
      </p>
    );

  return (
    <div>
      <h1>My Applications</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && holds.length === 0 && <p>No applications yet.</p>}
      {holds.map((h) => (
        <HoldCard key={h.holdId} hold={h} onChange={refresh} />
      ))}
    </div>
  );
}
