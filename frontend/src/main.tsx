import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StudentIdProvider } from "./contexts/StudentIdContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StudentIdProvider>
      <App />
    </StudentIdProvider>
  </React.StrictMode>,
);
