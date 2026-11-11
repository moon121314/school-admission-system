import { useEffect, useState } from "react";
import { api, extractErrorMessage } from "../api/client";
import type { MyHoldResponse, HoldStatus } from "../types/api";

const STATUS_LABEL: Record<HoldStatus, string> = {
  HELD: "Reserved",
  CONFIRMED: "Confirmed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const STATUS_CLASS: Record<HoldStatus, string> = {
  HELD: "status--held",
  CONFIRMED: "status--confirmed",
  EXPIRED: "status--expired",
  CANCELLED: "status--cancelled",
};

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
  const displayStatus: HoldStatus =
    hold.status === "HELD" && expiryMs <= now ? "EXPIRED" : hold.status;

  const remainingSec = Math.max(0, Math.floor((expiryMs - now) / 1000));
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const urgent = remainingSec > 0 && remainingSec < 60;

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

  return (
    <div className="hold-card">
      <div className="hold-card__header">
        <div>
          <h3 className="hold-card__title">{hold.className}</h3>
          <div className="hold-card__meta">Application #{hold.holdId}</div>
        </div>
        <span className={`hold-card__status ${STATUS_CLASS[displayStatus]}`}>
          {STATUS_LABEL[displayStatus]}
        </span>
      </div>

      {displayStatus === "HELD" && (
        <div
          className={`hold-card__countdown ${
            urgent ? "hold-card__countdown--urgent" : ""
          }`}
        >
          {urgent ? "⏳ Expires in " : "⏱ Expires in "}
          <strong>
            {mins}m {secs.toString().padStart(2, "0")}s
          </strong>
        </div>
      )}

      {error && <div className="alert alert--error">{error}</div>}

      {displayStatus === "HELD" && (
        <div className="hold-card__actions">
          <button
            className="btn btn--primary"
            onClick={confirmHold}
            disabled={busy}
          >
            {busy ? "Working..." : "Confirm payment"}
          </button>
          <button
            className="btn btn--danger"
            onClick={cancelHold}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
