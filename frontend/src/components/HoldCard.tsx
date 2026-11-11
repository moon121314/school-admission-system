import { useEffect, useState } from "react";
import { api, extractErrorMessage } from "../api/client";
import type { MyHoldResponse } from "../types/api";

export function HoldCard({
  hold,
  onChange,
}: {
  hold: MyHoldResponse;
  onChange: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expiryMs = new Date(hold.expiresAt).getTime();
  const displayStatus =
    hold.status === "HELD" && expiryMs <= now ? "EXPIRED" : hold.status;
  const remainingSec = Math.max(0, Math.floor((expiryMs - now) / 1000));
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  async function confirmHold() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/holds/${hold.holdId}/confirm`, null, {
        headers: { "X-Student-Id": localStorage.getItem("studentId") ?? "" },
      });
      onChange();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function cancelHold() {
    if (!window.confirm("Cancel this application?")) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/holds/${hold.holdId}`, {
        headers: { "X-Student-Id": localStorage.getItem("studentId") ?? "" },
      });
      onChange();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const canAct = displayStatus === "HELD" && !busy;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "1rem",
        marginBottom: "0.75rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{hold.className}</strong>
        <span style={{ fontWeight: 600 }}>{displayStatus}</span>
      </div>
      {displayStatus === "HELD" && (
        <p style={{ color: remainingSec < 60 ? "crimson" : "#555" }}>
          Expires in {mins}m {secs}s
        </p>
      )}
      {error && <p style={{ color: "crimson", fontSize: "0.9rem" }}>{error}</p>}
      {canAct && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button onClick={confirmHold} disabled={busy}>
            Confirm payment
          </button>
          <button onClick={cancelHold} disabled={busy}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
