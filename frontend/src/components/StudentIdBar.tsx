import { useState } from "react";
import { GraduationCap, Copy, Check, X, Pencil } from "lucide-react";
import { useStudentId } from "../hooks/useStudentId";
import { useToast } from "../contexts/ToastContext";
import { maskStudentId } from "../utils/mask";

function sanitize(raw: string): string {
  // Strip everything except ASCII digits, cap at 17.
  return raw.replace(/[^0-9]/g, "").slice(0, 17);
}

export function StudentIdBar() {
  const { studentId, setStudentId, clearStudentId } = useStudentId();
  const toast = useToast();
  const [draft, setDraft] = useState(studentId ?? "");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(!studentId);

  function save() {
    const clean = sanitize(draft);
    if (clean.length === 0) {
      toast.warn("Enter your birth registration number.");
      return;
    }
    if (clean.length < 17) {
      const remaining = 17 - clean.length;
      toast.warn(
        `Birth registration must be 17 digits — ${remaining} more needed.`,
      );
      return;
    }
    setStudentId(clean);
    setDraft(clean);
    setEditing(false);
    toast.success("Identity saved.");
  }

  function edit() {
    setDraft(studentId ?? "");
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setDraft(studentId ?? "");
  }

  function clear() {
    clearStudentId();
    setDraft("");
    setEditing(true);
    toast.info("Identity cleared.");
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

        {editing || !studentId ? (
          <>
            <input
              className="input max-w-[240px] font-mono text-sm"
              value={draft}
              onChange={(e) => setDraft(sanitize(e.target.value))}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text");
                setDraft(sanitize(pasted));
              }}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="Birth registration (17 digits)"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Birth registration number"
            />
            <button className="btn-primary" onClick={save}>
              Save
            </button>
            {studentId && (
              <button className="btn-secondary" onClick={cancel}>
                Cancel
              </button>
            )}
          </>
        ) : (
          <>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-success-50 text-success-700 text-xs font-medium border border-success-100 font-mono"
              title={studentId}
            >
              {maskStudentId(studentId)}
              <button
                onClick={copy}
                className="opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Copy full ID"
                title="Copy full ID to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </span>
            <button
              className="btn-secondary"
              onClick={edit}
              title="Change identity"
            >
              <Pencil className="w-3.5 h-3.5" />
              Change
            </button>
            <button
              className="btn-secondary"
              onClick={clear}
              title="Clear identity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
