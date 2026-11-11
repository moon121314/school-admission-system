import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { api, extractErrorMessage } from "../api/client";
import type { MyHoldResponse, HoldStatus } from "../types/api";
import { Modal } from "./Modal";
import { useToast } from "../contexts/ToastContext";

const STATUS_BADGE: Record<HoldStatus, string> = {
  HELD: "badge badge-warn",
  CONFIRMED: "badge badge-success",
  EXPIRED: "badge badge-neutral",
  CANCELLED: "badge badge-danger",
};

const STATUS_LABEL: Record<HoldStatus, string> = {
  HELD: "Reserved",
  CONFIRMED: "Confirmed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

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
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-navy-900">
            {hold.className}
          </h3>
          <p className="text-xs text-navy-500 font-mono mt-0.5">
            Application #{hold.holdId}
          </p>
        </div>
        <span className={STATUS_BADGE[displayStatus]}>
          {STATUS_LABEL[displayStatus]}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {displayStatus === "HELD" && (
          <>
            <Clock
              className={`w-5 h-5 ${urgent ? "text-danger-600" : "text-warn-600"}`}
            />
            <div>
              <p className="text-xs text-navy-500">Time remaining</p>
              <p
                className={`text-base font-semibold tabular-nums ${urgent ? "text-danger-600" : "text-navy-900"}`}
              >
                {mins}m {secs.toString().padStart(2, "0")}s
              </p>
            </div>
          </>
        )}
        {displayStatus === "CONFIRMED" && (
          <>
            <CheckCircle2 className="w-5 h-5 text-success-600" />
            <p className="text-sm text-navy-700">
              Your admission is confirmed.
            </p>
          </>
        )}
        {displayStatus === "EXPIRED" && (
          <>
            <AlertCircle className="w-5 h-5 text-navy-400" />
            <p className="text-sm text-navy-600">
              Hold expired — this seat was released.
            </p>
          </>
        )}
        {displayStatus === "CANCELLED" && (
          <>
            <XCircle className="w-5 h-5 text-danger-500" />
            <p className="text-sm text-navy-600">Application cancelled.</p>
          </>
        )}
      </div>

      {displayStatus === "HELD" && (
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1"
            onClick={confirmHold}
            disabled={busy}
          >
            {busy ? "Working..." : "Confirm payment"}
          </button>
          <button
            className="btn-danger"
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
