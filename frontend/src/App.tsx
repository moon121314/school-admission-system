import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { StudentIdBar } from "./components/StudentIdBar";
import { ClassesPage } from "./pages/ClassesPage";
import { MyHoldsPage } from "./pages/MyHoldsPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <StudentIdBar />
          <nav className="nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Classes
            </NavLink>
            <NavLink
              to="/me"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              My Applications
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Admin
            </NavLink>
          </nav>
          <main className="main">
            <Routes>
              <Route path="/" element={<ClassesPage />} />
              <Route path="/me" element={<MyHoldsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <footer className="footer">
            School Admission System · First-come, first-served
          </footer>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
