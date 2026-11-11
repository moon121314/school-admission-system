import { useEffect, useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";
import { extractErrorMessage, listAdminHolds } from "../../api/client";
import type { AdminHoldRow, HoldStatus } from "../../types/api";
import { useToast } from "../../contexts/ToastContext";

const STATUS_BADGE: Record<HoldStatus, string> = {
  HELD: "badge badge-warn",
  CONFIRMED: "badge badge-success",
  EXPIRED: "badge badge-neutral",
  CANCELLED: "badge badge-danger",
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
  const [search, setSearch] = useState("");
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.studentId.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-navy-900">All Holds</h2>
        <p className="text-sm text-navy-500">
          Every seat reservation across all classes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            className="input pl-9"
            placeholder="Search by student ID or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:max-w-[180px]"
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-50">
              <tr>
                {["ID", "Class", "Student", "Status", "Created", "Expires"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-navy-500 border-b border-navy-200"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 && (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i} className="border-b border-navy-100">
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="skeleton h-4 w-full max-w-[100px]" />
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
                    <p className="font-semibold text-navy-700">
                      No holds found
                    </p>
                    <p className="text-sm text-navy-500 mt-1">
                      {status || search
                        ? "Try clearing the filters."
                        : "Applications will appear here."}
                    </p>
                  </td>
                </tr>
              )}

              {filtered.map((h) => (
                <tr
                  key={h.holdId}
                  className="border-b border-navy-100 hover:bg-navy-50 transition-colors"
                >
                  <td className="px-4 py-3 tabular-nums text-navy-500">
                    #{h.holdId}
                  </td>
                  <td className="px-4 py-3 font-semibold text-navy-900">
                    {h.className}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-600">
                    {h.studentId}
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[h.status]}>{h.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-navy-500 whitespace-nowrap">
                    {new Date(h.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-navy-500 whitespace-nowrap">
                    {new Date(h.expiresAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-navy-500 gap-3">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary text-xs px-3 py-1.5"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages || 1}
            </span>
            <button
              className="btn-secondary text-xs px-3 py-1.5"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
