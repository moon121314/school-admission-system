import { useState } from "react";
import { GraduationCap, Copy, Check } from "lucide-react";
import { useStudentId } from "../hooks/useStudentId";
import { useToast } from "../contexts/ToastContext";

export function StudentIdBar() {
  const { studentId, setStudentId } = useStudentId();
  const toast = useToast();
  const [draft, setDraft] = useState(studentId ?? "");
  const [copied, setCopied] = useState(false);

  function save() {
    if (draft.length !== 17 || !/^\d+$/.test(draft)) {
      toast.warn("Birth registration number must be exactly 17 digits.");
      return;
    }
    setStudentId(draft);
    toast.success("Identity saved.");
  }

  async function copy() {
    if (!studentId) return;
    try {
      await navigator.clipboard.writeText(studentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.info("ID copied.");
    } catch {
      toast.error("Copy failed.");
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-navy-200">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-6 py-3 flex-wrap">
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-navy-900">School Admission</span>
        </div>
        <input
          className="input max-w-[240px] font-mono text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Birth registration (17 digits)"
          maxLength={17}
          inputMode="numeric"
          aria-label="Birth registration number"
        />
        <button className="btn-primary" onClick={save}>
          Save
        </button>
        {studentId && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-success-50 text-success-700 text-xs font-medium border border-success-100 font-mono">
            {studentId}
            <button
              onClick={copy}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Copy ID"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </span>
        )}
      </div>
    </header>
  );
}
