import { useEffect, useState } from "react";
import { extractErrorMessage, listAdminHolds } from "../../api/client";
import type { AdminHoldRow, HoldStatus } from "../../types/api";
import { useToast } from "../../contexts/ToastContext";
import { SkeletonRow } from "../../components/Skeleton";
import { IconInbox } from "../../components/Icons";

const STATUS_CLASS: Record<string, string> = {
  HELD: "badge--warn",
  CONFIRMED: "badge--success",
  EXPIRED: "",
  CANCELLED: "badge--full",
};

const STATUS_OPTIONS: { value: "" | HoldStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "HELD", label: "Reserved" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function AdminHoldsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<AdminHoldRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<"" | HoldStatus>("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await listAdminHolds({
        page,
        pageSize,
        status: status || undefined,
      });
      setRows(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.page !== page) setPage(data.page);
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
  }, [page, status]);

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>All Holds</h1>
          <p>Every seat reservation across all classes.</p>
        </div>
        <div className="filter-bar">
          <select
            className="input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | HoldStatus);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && rows.length === 0 && (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Class</th>
                <th>Student</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <IconInbox size={56} />
          </div>
          <h3 className="empty__title">No holds found</h3>
          <p className="empty__text">
            {status
              ? "Try clearing the filter."
              : "Applications will appear here."}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Class</th>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.holdId}>
                    <td className="table__num">#{h.holdId}</td>
                    <td>
                      <strong>{h.className}</strong>
                    </td>
                    <td
                      className="text-muted"
                      style={{ fontFamily: "ui-monospace, monospace" }}
                    >
                      {h.studentId}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[h.status] ?? ""}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(h.expiresAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="text-muted text-sm">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="pagination__buttons">
              <button
                className="btn btn--ghost btn--sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-muted text-sm">
                Page {page} of {totalPages || 1}
              </span>
              <button
                className="btn btn--ghost btn--sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
