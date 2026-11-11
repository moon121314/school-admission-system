import { useEffect, useState } from "react";
import { api, extractErrorMessage } from "../api/client";
import type { MyHoldResponse, HoldStatus } from "../types/api";
import { Modal } from "./Modal";
import { useToast } from "../contexts/ToastContext";

const LABEL: Record<HoldStatus, string> = {
  HELD: "Seat reserved",
  CONFIRMED: "Admission confirmed",
  EXPIRED: "Hold expired",
  CANCELLED: "Application cancelled",
};

const BADGE: Record<HoldStatus, string> = {
  HELD: "badge--warn",
  CONFIRMED: "badge--success",
  EXPIRED: "",
  CANCELLED: "badge--full",
};

function HoldRing({
  remainingSec,
  totalSec,
  expired,
}: {
  remainingSec: number;
  totalSec: number;
  expired: boolean;
}) {
  const size = 56;
  const r = 22;
  const c = 2 * Math.PI * r;
  const pct =
    totalSec > 0 ? Math.max(0, Math.min(1, remainingSec / totalSec)) : 0;
  const offset = c * (1 - pct);
  const urgent = !expired && remainingSec <= 60;

  return (
    <svg className="hold-ring" width={size} height={size}>
      <circle className="hold-ring__track" cx={size / 2} cy={size / 2} r={r} />
      <circle
        className={`hold-ring__fill ${expired ? "hold-ring__fill--done" : urgent ? "hold-ring__fill--urgent" : ""}`}
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeDasharray={c}
        strokeDashoffset={expired ? c : offset}
      />
      <text
        className="hold-ring__text"
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
      >
        {expired
          ? "—"
          : remainingSec >= 60
            ? `${Math.floor(remainingSec / 60)}m`
            : `${remainingSec}s`}
      </text>
    </svg>
  );
}

export function HoldCard({
  hold,
  onChange,
}: {
  hold: MyHoldResponse;
  onChange: () => void;
}) {
  const toast = useToast();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [initialSec] = useState(() =>
    Math.max(
      1,
      Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000),
    ),
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expiryMs = new Date(hold.expiresAt).getTime();
  const displayStatus: HoldStatus =
    hold.status === "HELD" && expiryMs <= now ? "EXPIRED" : hold.status;
  const remainingSec = Math.max(0, Math.floor((expiryMs - now) / 1000));

  async function confirmHold() {
    setBusy(true);
    try {
      await api.post(`/holds/${hold.holdId}/confirm`, null, {
        headers: { "X-Student-Id": localStorage.getItem("studentId") ?? "" },
      });
      toast.success("Payment confirmed. Your seat is secured.");
      onChange();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function cancelHold() {
    setBusy(true);
    try {
      await api.delete(`/holds/${hold.holdId}`, {
        headers: { "X-Student-Id": localStorage.getItem("studentId") ?? "" },
      });
      toast.info("Application cancelled.");
      setConfirmOpen(false);
      onChange();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card hold-card fade-in">
      <div className="hold-card__header">
        <div>
          <h3 className="hold-card__title">{hold.className}</h3>
          <div className="hold-card__meta">Application #{hold.holdId}</div>
        </div>
        <span className={`badge ${BADGE[displayStatus]}`}>
          {LABEL[displayStatus]}
        </span>
      </div>

      <div className="hold-card__body">
        {displayStatus === "HELD" && (
          <HoldRing
            remainingSec={remainingSec}
            totalSec={initialSec}
            expired={false}
          />
        )}
        <div className="hold-card__info">
          <div className="hold-card__status-label">
            {displayStatus === "HELD" ? "Time remaining" : "Status"}
          </div>
          <div className="hold-card__status-value">
            {displayStatus === "HELD"
              ? `${Math.floor(remainingSec / 60)}m ${(remainingSec % 60).toString().padStart(2, "0")}s`
              : LABEL[displayStatus]}
          </div>
        </div>
      </div>

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
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cancel this application?"
        onConfirm={cancelHold}
        confirmLabel="Yes, cancel"
        cancelLabel="Keep it"
        danger
      >
        Your seat for <strong>{hold.className}</strong> will be released
        immediately and offered to other students.
      </Modal>
    </div>
  );
}
