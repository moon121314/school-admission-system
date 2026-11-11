import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  ListTree,
  ArrowLeft,
  Menu,
  X,
  Bell,
} from "lucide-react";

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const titleMap: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/classes": "Manage Classes",
    "/admin/holds": "All Holds",
  };
  const title = titleMap[location.pathname] ?? "Admin";

  const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/classes", label: "Manage Classes", icon: GraduationCap },
    { to: "/admin/holds", label: "All Holds", icon: ListTree },
  ];

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen flex bg-navy-50">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-navy-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-4 flex items-center gap-3 border-b border-navy-200">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white flex-shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-navy-900 leading-tight truncate">
              School Admission
            </p>
            <p className="text-xs text-navy-500 leading-tight">Admin Panel</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded-md text-navy-500 hover:bg-navy-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-navy-600 hover:bg-navy-50 hover:text-navy-900"
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {it.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-navy-200">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-navy-600 hover:bg-navy-50 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-navy-950/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 lg:pl-64 min-w-0">
        <header className="h-16 sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-navy-200 flex items-center gap-4 px-6">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-lg text-navy-600 hover:bg-navy-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-navy-900 truncate">
            {title}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-navy-500">
              {today}
            </span>
            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold">
              A
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
