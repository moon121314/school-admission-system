import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Armchair,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  extractErrorMessage,
  getAdminStats,
  listAdminHolds,
} from "../../api/client";
import type { AdminStatsResponse, AdminHoldRow } from "../../types/api";
import { useToast } from "../../contexts/ToastContext";

const STATUS_BADGE: Record<string, string> = {
  HELD: "badge badge-warn",
  CONFIRMED: "badge badge-success",
  EXPIRED: "badge badge-neutral",
  CANCELLED: "badge badge-danger",
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

  const cards = stats
    ? [
        {
          label: "Classes",
          value: stats.totalClasses,
          icon: Building2,
          cls: "bg-brand-50 text-brand-600",
        },
        {
          label: "Total Seats",
          value: stats.totalSeats,
          icon: Armchair,
          cls: "bg-navy-100 text-navy-700",
        },
        {
          label: "Reserved",
          value: stats.heldSeats,
          icon: Clock,
          cls: "bg-warn-50 text-warn-600",
        },
        {
          label: "Confirmed",
          value: stats.confirmedSeats,
          icon: CheckCircle2,
          cls: "bg-success-50 text-success-600",
        },
        {
          label: "Available",
          value: stats.availableSeats,
          icon: Users,
          cls: "bg-brand-50 text-brand-600",
        },
      ]
    : [];

  const distribution = stats
    ? [
        {
          label: "Confirmed",
          value: stats.confirmedSeats,
          bar: "bg-success-500",
        },
        { label: "Reserved", value: stats.heldSeats, bar: "bg-warn-500" },
        {
          label: "Available",
          value: stats.availableSeats,
          bar: "bg-brand-500",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {stats && stats.expiringSoon > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warn-50 border border-warn-200 text-warn-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>{stats.expiringSoon}</strong> hold
            {stats.expiringSoon === 1 ? "" : "s"} expiring in the next 5
            minutes.
          </div>
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {loading &&
          !stats &&
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-7 w-12" />
            </div>
          ))}

        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card p-4">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.cls}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500 mb-1">
                {c.label}
              </p>
              <p className="text-2xl font-bold text-navy-900 tabular-nums">
                {c.value}
              </p>
            </div>
          );
        })}
      </div>

      {stats && stats.totalSeats > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy-900">
              Seat distribution
            </h2>
            <span className="text-xs text-navy-500">
              {stats.totalSeats} total
            </span>
          </div>
          <div className="space-y-3">
            {distribution.map((b) => {
              const pct = (b.value / Math.max(1, stats.totalSeats)) * 100;
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-xs text-navy-500 mb-1">
                    <span>{b.label}</span>
                    <span className="tabular-nums">
                      {b.value} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-navy-100 overflow-hidden">
                    <div
                      className={`h-full ${b.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy-900">
              Recent activity
            </h2>
            <Link
              to="/admin/holds"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading && recent.length === 0 && (
            <div className="space-y-2">
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          )}

          {!loading && recent.length === 0 && (
            <p className="text-sm text-navy-500 py-6 text-center">
              No holds yet. Applications will appear here.
            </p>
          )}

          {recent.length > 0 && (
            <ul className="divide-y divide-navy-100">
              {recent.map((h) => (
                <li key={h.holdId} className="py-2.5 flex items-center gap-3">
                  <span className="text-xs text-navy-400 font-mono w-10 flex-shrink-0">
                    #{h.holdId}
                  </span>
                  <span className="text-sm text-navy-900 font-medium truncate flex-1">
                    {h.className}
                  </span>
                  <span className="hidden sm:inline text-xs text-navy-500 font-mono truncate max-w-[140px]">
                    {h.studentId}
                  </span>
                  <span
                    className={STATUS_BADGE[h.status] ?? "badge badge-neutral"}
                  >
                    {h.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-navy-900 mb-3">
            Quick actions
          </h2>
          <div className="space-y-2">
            <Link
              to="/admin/classes"
              className="flex items-center gap-3 p-3 rounded-lg border border-navy-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-brand-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-900">
                  Manage classes
                </p>
                <p className="text-xs text-navy-500">Create or edit classes</p>
              </div>
            </Link>
            <Link
              to="/admin/holds"
              className="flex items-center gap-3 p-3 rounded-lg border border-navy-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
            >
              <ListTree className="w-4 h-4 text-brand-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-900">
                  View all holds
                </p>
                <p className="text-xs text-navy-500">Filter by status</p>
              </div>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-3 p-3 rounded-lg border border-navy-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
            >
              <Users className="w-4 h-4 text-brand-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-900">
                  Public portal
                </p>
                <p className="text-xs text-navy-500">See parent view</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { GraduationCap, ListTree } from "lucide-react";
