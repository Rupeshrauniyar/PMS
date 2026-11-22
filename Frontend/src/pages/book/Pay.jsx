import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Check, Wallet, Smartphone, Banknote } from "lucide-react";
import { Capacitor } from "@capacitor/core";

import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { getPublicAppOrigin } from "../../utils/propertyShare";
import { cn } from "@/lib/utils";

const METHODS = [
  {
    id: "esewa",
    label: "eSewa",
    sub: "eSewa Mobile Wallet",
    icon: Wallet,
  },
  {
    id: "khalti",
    label: "Khalti / ConnectIPS",
    sub: "Khalti Wallet, Mobile Banking & ConnectIPS",
    icon: Smartphone,
  },
  {
    id: "cash",
    label: "Pay at Property",
    sub: "Cash or bank transfer at handover",
    icon: Banknote,
  },
];

function submitHiddenForm(actionUrl, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";
  Object.entries(fields).forEach(([k, v]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = String(v ?? "");
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

const Pay = () => {
  const { id, price } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [gateways, setGateways] = useState({
    esewa: { enabled: true },
    khalti: { enabled: false },
    cash: { enabled: true },
  });
  const [selected, setSelected] = useState("esewa");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/payment/config")
      .then((res) => {
        if (cancelled || !res.data?.gateways) return;
        const g = res.data.gateways;
        setGateways(g);
        if (!g.esewa?.enabled && g.khalti?.enabled) setSelected("khalti");
        else if (!g.esewa?.enabled && !g.khalti?.enabled) setSelected("cash");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingConfig(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePay = async () => {
    if (!id || submitting) return;
    try {
      setSubmitting(true);
      const returnOrigin = Capacitor.isNativePlatform()
        ? getPublicAppOrigin()
        : window.location.origin;

      const res = await api.post("/api/payment/initiate", {
        bookingId: id,
        gateway: selected,
        returnOrigin,
      });

      const data = res.data || {};
      if (selected === "cash" && data.completed) {
        toast({ title: "Pay-at-property confirmed", variant: "success" });
        navigate(data.propId ? `/booked/${data.propId}` : "/profile", { replace: true });
        return;
      }

      if (selected === "khalti" && data.payment_url) {
        try {
          localStorage.setItem(
            "pending_payment",
            JSON.stringify({
              gateway: "khalti",
              bookingId: id,
              pidx: data.pidx,
              transactionUuid: data.transaction_uuid,
              ts: Date.now(),
            }),
          );
        } catch {
          /* ignore */
        }
        window.location.href = data.payment_url;
        return;
      }

      if (selected === "esewa" && data.formUrl && data.fields) {
        try {
          localStorage.setItem(
            "pending_payment",
            JSON.stringify({
              gateway: "esewa",
              bookingId: id,
              transactionUuid: data.fields.transaction_uuid,
              ts: Date.now(),
            }),
          );
        } catch {
          /* ignore */
        }
        submitHiddenForm(data.formUrl, data.fields);
        return;
      }

      toast({ title: "Could not start payment", variant: "error" });
    } catch (err) {
      toast({
        title: err.response?.data?.message || "Payment setup failed",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-6 pb-16">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Payment
        </h1>
      </div>

      {/* Amount Summary */}
      <div className="flex items-baseline justify-between rounded-2xl border border-border p-5">
        <span className="text-sm text-muted-foreground">Total due</span>
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {formatPrice(price)}
        </span>
      </div>

      {/* Gateway Selector */}
      {loadingConfig ? (
        <div className="space-y-2.5">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-2.5" role="radiogroup" aria-label="Payment method">
          {METHODS.map((m) => {
            const enabled = Boolean(gateways?.[m.id]?.enabled);
            if (!enabled && m.id !== "esewa") return null;
            const active = selected === m.id;
            const Icon = m.icon;

            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!enabled}
                onClick={() => setSelected(m.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-45",
                  active
                    ? "border-foreground bg-secondary/50"
                    : "border-border hover:bg-secondary/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {m.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.sub}</p>
                  </div>
                </div>

                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border",
                  )}
                >
                  {active ? <Check className="size-3" aria-hidden="true" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Button
        size="lg"
        loading={submitting}
        onClick={handlePay}
        className="w-full rounded-full"
      >
        {selected === "cash"
          ? "Confirm pay at property"
          : `Pay ${formatPrice(price)}`}
      </Button>
    </div>
  );
};

export default Pay;
