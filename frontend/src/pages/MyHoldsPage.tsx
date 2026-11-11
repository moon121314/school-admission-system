import { useEffect, useState } from "react";
import { Inbox, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { extractErrorMessage, listMyHolds } from "../api/client";
import type { MyHoldResponse } from "../types/api";
import { useStudentId } from "../hooks/useStudentId";
import { useToast } from "../contexts/ToastContext";
import { HoldCard } from "../components/HoldCard";
import { SkeletonCard } from "../components/Skeleton";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Applications</h1>
        <p className="text-sm text-navy-500 mt-1">
          Your seat reservations and confirmed admissions.
        </p>
      </div>

      {!studentId && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-50 border border-brand-100 text-brand-800 text-sm">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>
            Enter your 17-digit birth registration number at the top to view
            your applications.
          </span>
        </div>
      )}

      {studentId && loading && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {studentId && !loading && holds.length === 0 && (
        <div className="card p-16 text-center">
          <Inbox className="w-12 h-12 mx-auto text-navy-300 mb-3" />
          <p className="font-semibold text-navy-700">No applications yet</p>
          <p className="text-sm text-navy-500 mt-1 mb-4">
            Browse available classes to get started.
          </p>
          <Link to="/" className="btn-primary inline-flex">
            Browse Classes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {studentId && !loading && holds.length > 0 && (
        <div className="space-y-3">
          {holds.map((h) => (
            <HoldCard key={h.holdId} hold={h} onChange={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
