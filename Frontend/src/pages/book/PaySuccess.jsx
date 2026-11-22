import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

/**
 * Extract query parameter even when gateways append a second '?' (e.g. `?gateway=esewa?data=...`).
 */
function extractCallbackParam(searchParams, key) {
  const direct = searchParams.get(key);
  if (direct) return direct;
  if (typeof window === "undefined") return null;
  const regex = new RegExp(`[?&]${key}=([^&#]+)`);
  const match = window.location.href.match(regex);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function readPendingPayment() {
  try {
    const raw = localStorage.getItem("pending_payment");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.ts && Date.now() - parsed.ts > 24 * 60 * 60 * 1000) {
      localStorage.removeItem("pending_payment");
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const PaySuccess = () => {
  const [params] = useSearchParams();
  const esewaData = extractCallbackParam(params, "data");
  const khaltiPidx = extractCallbackParam(params, "pidx");

  const [state, setState] = useState({
    verifying: true,
    verified: false,
    payment: null,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      try {
        if (esewaData) {
          const normalized = esewaData.trim().replace(/\s/g, "+");
          const res = await api.post("/api/payment/verify/esewa", {
            data: normalized,
          });
          try {
            localStorage.removeItem("pending_payment");
          } catch {
            /* ignore */
          }
          if (!cancelled) {
            setState({
              verifying: false,
              verified: true,
              payment: res.data?.payment || null,
              error: "",
            });
          }
          return;
        }

        if (khaltiPidx) {
          const res = await api.post("/api/payment/verify/khalti", {
            pidx: khaltiPidx,
          });
          try {
            localStorage.removeItem("pending_payment");
          } catch {
            /* ignore */
          }
          if (!cancelled) {
            setState({
              verifying: false,
              verified: true,
              payment: res.data?.payment || null,
              error: "",
            });
          }
          return;
        }

        // Fallback: check localStorage pending_payment via server-to-server Status API
        const pending = readPendingPayment();
        if (pending?.gateway === "esewa" && (pending.transactionUuid || pending.bookingId)) {
          const res = await api.post("/api/payment/verify/esewa", {
            transactionUuid: pending.transactionUuid,
            bookingId: pending.bookingId,
          });
          localStorage.removeItem("pending_payment");
          if (!cancelled) {
            setState({
              verifying: false,
              verified: true,
              payment: res.data?.payment || null,
              error: "",
            });
          }
          return;
        }

        if (pending?.gateway === "khalti" && pending.pidx) {
          const res = await api.post("/api/payment/verify/khalti", {
            pidx: pending.pidx,
          });
          localStorage.removeItem("pending_payment");
          if (!cancelled) {
            setState({
              verifying: false,
              verified: true,
              payment: res.data?.payment || null,
              error: "",
            });
          }
          return;
        }

        if (!cancelled) {
          setState({
            verifying: false,
            verified: false,
            payment: null,
            error: "Missing payment verification reference.",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            verifying: false,
            verified: false,
            payment: null,
            error:
              err.response?.data?.message ||
              "Could not verify payment with the gateway.",
          });
        }
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [esewaData, khaltiPidx]);

  if (state.verifying) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-3 py-24 text-center">
        <Loader2 className="size-7 animate-spin text-foreground" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">
          Verifying payment…
        </p>
      </div>
    );
  }

  if (!state.verified) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-destructive">
          <AlertCircle className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Verification incomplete
        </h1>
        <p className="text-sm text-muted-foreground">{state.error}</p>
        <Button asChild className="mt-2 rounded-full px-6">
          <Link to="/profile">Go to bookings</Link>
        </Button>
      </div>
    );
  }

  const p = state.payment || {};
  const backLink = p.propId ? `/booked/${p.propId}` : "/profile";

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-5 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Payment verified
        </h1>
        <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">
          {p.gateway === "khalti" ? "Khalti" : "eSewa"}
        </p>
      </div>

      <div className="w-full divide-y divide-border/70 rounded-2xl border border-border px-4 text-left text-sm">
        {p.amount ? (
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold tabular-nums text-foreground">
              {formatPrice(p.amount)}
            </span>
          </div>
        ) : null}
        {p.reference ? (
          <div className="flex justify-between gap-3 py-3">
            <span className="text-muted-foreground">Reference</span>
            <span className="selectable truncate font-mono text-xs font-semibold text-foreground">
              {p.reference}
            </span>
          </div>
        ) : null}
      </div>

      <Button asChild className="w-full rounded-full">
        <Link to={backLink}>Done</Link>
      </Button>
    </div>
  );
};

export default PaySuccess;
