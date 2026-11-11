import { useState } from "react";
import { useStudentId } from "../hooks/useStudentId";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { IconCopy, IconGraduationCap, IconMoon, IconSun } from "./Icons";

export function StudentIdBar() {
  const { studentId, setStudentId } = useStudentId();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const [draft, setDraft] = useState(studentId ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (draft.length !== 17 || !/^\d+$/.test(draft)) {
      setError("Must be exactly 17 digits.");
      toast.warn("Birth registration number must be 17 digits.");
      return;
    }
    setError(null);
    setStudentId(draft);
    toast.success("Identity saved.");
  }

  async function copy() {
    if (!studentId) return;
    try {
      await navigator.clipboard.writeText(studentId);
      toast.info("ID copied to clipboard.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__logo">
          <IconGraduationCap size={18} />
        </div>
        <span>School Admission</span>
      </div>

      <button
        className="icon-btn"
        onClick={toggle}
        aria-label={
          theme === "light" ? "Switch to dark mode" : "Switch to light mode"
        }
        title={theme === "light" ? "Dark mode" : "Light mode"}
      >
        {theme === "light" ? <IconMoon size={16} /> : <IconSun size={16} />}
      </button>

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
        <span className="topbar__badge">
          ID: {studentId}
          <button className="topbar__copy" onClick={copy} aria-label="Copy ID">
            <IconCopy size={13} />
          </button>
        </span>
      )}
      {error && (
        <span
          className="alert alert--error"
          style={{ padding: "4px 10px", marginBottom: 0, fontSize: 12 }}
        >
          {error}
        </span>
      )}
    </header>
  );
}
