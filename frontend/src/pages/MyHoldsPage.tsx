import { useEffect, useState } from "react";
import { extractErrorMessage, listMyHolds } from "../api/client";
import type { MyHoldResponse } from "../types/api";
import { useStudentId } from "../hooks/useStudentId";
import { useToast } from "../contexts/ToastContext";
import { HoldCard } from "../components/HoldCard";
import { SkeletonCard } from "../components/Skeleton";
import { IconInbox } from "../components/Icons";

export function MyHoldsPage() {
  const { studentId } = useStudentId();
  const toast = useToast();
  const [holds, setHolds] = useState<MyHoldResponse[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!studentId) {
      setLoading(false);
      return;
    }
    try {
      setHolds(await listMyHolds(studentId));
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
  }, [studentId]);

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>My Applications</h1>
          <p>Your seat reservations and confirmed admissions.</p>
        </div>
      </div>

      {!studentId && (
        <div className="alert alert--info">
          <span className="alert__icon">ℹ️</span>
          <span>
            Enter your 17-digit birth registration number at the top to view
            your applications.
          </span>
        </div>
      )}

      {studentId && loading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {studentId && !loading && holds.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <IconInbox size={56} />
          </div>
          <h3 className="empty__title">No applications yet</h3>
          <p className="empty__text">
            You haven't applied for any class. Open the Classes tab to get
            started.
          </p>
        </div>
      )}

      {studentId &&
        !loading &&
        holds.map((h) => (
          <HoldCard key={h.holdId} hold={h} onChange={refresh} />
        ))}
    </>
  );
}
