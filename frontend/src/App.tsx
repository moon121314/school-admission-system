import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import { StudentIdBar } from "./components/StudentIdBar";
import { ClassesPage } from "./pages/ClassesPage";
import { MyHoldsPage } from "./pages/MyHoldsPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <StudentIdBar />
      <nav
        style={{
          padding: "0.75rem 2rem",
          borderBottom: "1px solid #eee",
          display: "flex",
          gap: "1rem",
        }}
      >
        <NavLink to="/">Classes</NavLink>
        <NavLink to="/me">My Applications</NavLink>
        <NavLink to="/admin">Admin</NavLink>
      </nav>
      <main
        style={{ padding: "1.5rem 2rem", maxWidth: 1000, margin: "0 auto" }}
      >
        <Routes>
          <Route path="/" element={<ClassesPage />} />
          <Route path="/me" element={<MyHoldsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
