import { useState } from "react";
import { useStudentId } from "../hooks/useStudentId";

export function StudentIdBar() {
  const { studentId, setStudentId } = useStudentId();
  const [draft, setDraft] = useState(studentId ?? "");

  function save() {
    if (draft.length !== 17 || !/^\d+$/.test(draft)) {
      alert("Birth registration number must be exactly 17 digits.");
      return;
    }
    setStudentId(draft);
  }

  return (
    <header
      style={{
        padding: "1rem 2rem",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <strong style={{ marginRight: "auto" }}>School Admission</strong>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Birth registration (17 digits)"
        maxLength={17}
        style={{ padding: "0.4rem", width: "18rem" }}
      />
      <button onClick={save} style={{ padding: "0.4rem 1rem" }}>
        Save
      </button>
      {studentId && (
        <span style={{ color: "#666", fontSize: "0.9rem" }}>
          ID: {studentId}
        </span>
      )}
    </header>
  );
}
