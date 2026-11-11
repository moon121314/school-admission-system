import { useEffect, useState } from "react";
import {
  extractErrorMessage,
  getAdminStats,
  listAdminHolds,
} from "../../api/client";
import type { AdminStatsResponse, AdminHoldRow } from "../../types/api";
import { useToast } from "../../contexts/ToastContext";
import { Skeleton, SkeletonRow } from "../../components/Skeleton";
import { IconAlertCircle } from "../../components/Icons";

const STATUS_CLASS: Record<string, string> = {
  HELD: "badge--warn",
  CONFIRMED: "badge--success",
  EXPIRED: "",
  CANCELLED: "badge--full",
};

export function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [recent, setRecent] = useState<AdminHoldRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [s, h] = await Promise.all([
        getAdminStats(),
        listAdminHolds({ page: 1, pageSize: 5 }),
      ]);
      setStats(s);
      setRecent(h.items);
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

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Dashboard</h1>
          <p>Live overview of classes, seats, and applications.</p>
        </div>
      </div>

      {loading && !stats && (
        <div className="stats">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="stat">
              <Skeleton width="60%" height={12} />
              <Skeleton width="40%" height={28} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="stats">
          <div className="stat">
            <div className="stat__label">Classes</div>
            <div className="stat__value stat__value--primary">
              {stats.totalClasses}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">Total seats</div>
            <div className="stat__value">{stats.totalSeats}</div>
          </div>
          <div className="stat">
            <div className="stat__label">Reserved</div>
            <div className="stat__value stat__value--warning">
              {stats.heldSeats}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">Confirmed</div>
            <div className="stat__value stat__value--success">
              {stats.confirmedSeats}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">Available</div>
            <div className="stat__value stat__value--primary">
              {stats.availableSeats}
            </div>
          </div>
        </div>
      )}

      {stats && stats.expiringSoon > 0 && (
        <div className="alert alert--warning" style={{ marginBottom: 16 }}>
          <span className="alert__icon">
            <IconAlertCircle size={16} />
          </span>
          <span>
            <strong>{stats.expiringSoon}</strong> hold
            {stats.expiringSoon === 1 ? "" : "s"} expiring in the next 5
            minutes.
          </span>
        </div>
      )}

      <div className="card form-card">
        <h2 className="form-card__title">Recent activity</h2>
        {loading && recent.length === 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Student</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        )}
        {!loading && recent.length === 0 && (
          <p className="text-muted text-sm" style={{ padding: "8px 0" }}>
            No holds yet. Activity will appear here as parents apply.
          </p>
        )}
        {recent.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Student</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((h) => (
                <tr key={h.holdId}>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
