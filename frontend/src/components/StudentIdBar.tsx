import { useState } from "react";
import { useStudentId } from "../hooks/useStudentId";

export function StudentIdBar() {
  const { studentId, setStudentId } = useStudentId();
  const [draft, setDraft] = useState(studentId ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (draft.length !== 17 || !/^\d+$/.test(draft)) {
      setError("Must be exactly 17 digits.");
      return;
    }
    setError(null);
    setStudentId(draft);
  }

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__logo">🎓</div>
        <span>School Admission</span>
      </div>

      <input
        className="topbar__input"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="Birth registration (17 digits)"
        maxLength={17}
        inputMode="numeric"
        aria-label="Birth registration number"
      />
      <button className="btn btn--primary" onClick={save}>
        Save
      </button>

      {studentId && (
        <span className="topbar__saved">
          ID: <strong>{studentId}</strong>
        </span>
      )}
      {error && <span className="topbar__error">{error}</span>}
    </header>
  );
}
