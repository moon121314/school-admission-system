import { NavLink, Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <>
      <div className="admin-subnav">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/classes"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Manage Classes
        </NavLink>
        <NavLink
          to="/admin/holds"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          All Holds
        </NavLink>
      </div>
      <Outlet />
    </>
  );
}
