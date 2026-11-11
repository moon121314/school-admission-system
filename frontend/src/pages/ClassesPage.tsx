import { useEffect, useMemo, useState } from "react";
import { Search, X, School, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api, extractErrorMessage, listClasses } from "../api/client";
import type { ClassResponse } from "../types/api";
import { useStudentId } from "../hooks/useStudentId";
import { useToast } from "../contexts/ToastContext";
import { SkeletonCard } from "../components/Skeleton";

type SortKey = "available" | "name" | "total";

export function ClassesPage() {
  const { studentId } = useStudentId();
  const toast = useToast();
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortKey>("available");

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
    let list = q
      ? classes.filter((c) => c.name.toLowerCase().includes(q))
      : [...classes];
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "total") return b.totalSeats - a.totalSeats;
      return b.availableSeats - a.availableSeats;
    });
    return list;
  }, [classes, debounced, sort]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-8 sm:p-12">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-4">
            <GraduationCap className="w-3.5 h-3.5" />
            First-come, first-served admission
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
            Start Your Child's Educational Journey With Us
          </h1>
          <p className="text-brand-100 text-base sm:text-lg mb-6">
            Explore available classes, check seat availability, and secure your
            admission online — in minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#classes"
              className="btn-primary bg-white text-brand-700 hover:bg-brand-50"
            >
              Explore Available Classes
            </a>
            <Link
              to="/me"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Track My Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
          <School className="w-80 h-80" strokeWidth={0.8} />
        </div>
      </section>

      {/* Info strip */}
      <section className="grid sm:grid-cols-3 gap-3">
        {[
          {
            title: "How it works",
            text: "Apply → seat held → pay within the hold window.",
          },
          {
            title: "Hold duration",
            text: "Each reservation expires after 10 minutes.",
          },
          {
            title: "No queue",
            text: "First-come, first-served. No lottery involved.",
          },
        ].map((x) => (
          <div key={x.title} className="card p-4">
            <p className="text-sm font-semibold text-navy-900">{x.title}</p>
            <p className="text-xs text-navy-500 mt-1">{x.text}</p>
          </div>
        ))}
      </section>

      {/* Classes grid */}
      <section id="classes" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy-900">
              Available Classes
            </h2>
            <p className="text-sm text-navy-500">
              Live seat counts updated every 3 seconds.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                className="input pl-9 pr-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search classes..."
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-navy-400 hover:text-navy-700"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              className="input max-w-[180px]"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="available">Sort: Available</option>
              <option value="name">Sort: Name</option>
              <option value="total">Sort: Total seats</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && classes.length === 0 && (
          <EmptyCard
            title="No classes yet"
            text="An administrator has not created any classes."
          />
        )}

        {!loading && classes.length > 0 && filtered.length === 0 && (
          <EmptyCard
            title="No matches"
            text={`No class name matches "${search}".`}
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const used = c.heldSeats + c.confirmedSeats;
              const pct = Math.min(
                100,
                Math.round((used / Math.max(1, c.totalSeats)) * 100),
              );
              const isFull = c.availableSeats === 0;
              const barColor = isFull
                ? "bg-danger-500"
                : pct >= 80
                  ? "bg-warn-500"
                  : "bg-brand-500";
              return (
                <div key={c.id} className="card p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-navy-900 leading-snug">
                      {c.name}
                    </h3>
                    <span
                      className={
                        isFull
                          ? "badge badge-danger"
                          : pct >= 80
                            ? "badge badge-warn"
                            : "badge badge-success"
                      }
                    >
                      {isFull ? "Full" : pct >= 80 ? "Limited" : "Available"}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span
                      className={`text-3xl font-bold tabular-nums ${isFull ? "text-danger-600" : "text-navy-900"}`}
                    >
                      {c.availableSeats}
                    </span>
                    <span className="text-sm text-navy-500">
                      of {c.totalSeats} available
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs text-navy-500 mb-3">
                    <span>
                      Reserved:{" "}
                      <strong className="text-navy-700">{c.heldSeats}</strong>
                    </span>
                    <span>
                      Confirmed:{" "}
                      <strong className="text-navy-700">
                        {c.confirmedSeats}
                      </strong>
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-navy-100 overflow-hidden mb-4">
                    <div
                      className={`h-full ${barColor} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <button
                    className="btn-primary mt-auto"
                    onClick={() => apply(c.id)}
                    disabled={isFull || applying === c.id}
                  >
                    {isFull
                      ? "Class full"
                      : applying === c.id
                        ? "Reserving..."
                        : "Apply Now"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="card p-16 text-center">
      <School className="w-12 h-12 mx-auto text-navy-300 mb-3" />
      <p className="font-semibold text-navy-700">{title}</p>
      <p className="text-sm text-navy-500 mt-1">{text}</p>
    </div>
  );
}
