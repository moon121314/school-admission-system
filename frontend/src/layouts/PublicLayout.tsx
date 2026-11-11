import { NavLink, Outlet } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { StudentIdBar } from "../components/StudentIdBar";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-50">
      <StudentIdBar />
      <nav className="bg-white border-b border-navy-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-1 py-2">
          <NavItem to="/" label="Available Classes" end />
          <NavItem to="/me" label="My Applications" />
          <div className="ml-auto flex items-center gap-2 text-sm text-navy-500">
            <GraduationCap className="w-4 h-4" />
            <span>First-come, first-served</span>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-navy-200 bg-white py-6 text-center text-sm text-navy-500">
        School Admission System · Demonstration Portal
      </footer>
    </div>
  );
}

function NavItem({
  to,
  label,
  end,
}: {
  to: string;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-navy-500 hover:bg-navy-50 hover:text-navy-900"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
