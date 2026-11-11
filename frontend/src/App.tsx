import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import { PublicLayout } from "./layouts/PublicLayout";
import { ClassesPage } from "./pages/ClassesPage";
import { MyHoldsPage } from "./pages/MyHoldsPage";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<ClassesPage />} />
            <Route path="/me" element={<MyHoldsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
