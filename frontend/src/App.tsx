import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ClassesPage } from "./pages/ClassesPage";
import { MyHoldsPage } from "./pages/MyHoldsPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminClassesPage } from "./pages/admin/AdminClassesPage";
import { AdminHoldsPage } from "./pages/admin/AdminHoldsPage";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<ClassesPage />} />
            <Route path="/me" element={<MyHoldsPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="classes" element={<AdminClassesPage />} />
            <Route path="holds" element={<AdminHoldsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
