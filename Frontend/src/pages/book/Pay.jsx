import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, ChevronLeft, ShieldCheck, AlertCircle } from "lucide-react";

import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { getPublicAppOrigin } from "../../utils/propertyShare";

const Pay = () => {
  const param = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!param?.id || !param?.price) {
      setPayment({ message: "Missing booking reference or payment amount." });
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    api
      .post("/api/payment/create-payment", {
        amount: param.price,
        id: param.id,
      })
      .then((res) => {
        if (!cancelled) setPayment(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPayment({
            message: err.response?.data?.message || "Payment setup failed.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [param?.id, param?.price]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  if (!payment?.signature) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          icon={AlertCircle}
          title="Unable to initialize payment"
          description={payment?.message || "Please verify your booking status and try again."}
          action={
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go back
            </Button>
          }
        />
      </div>
    );
  }

  const origin = getPublicAppOrigin();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="-ml-2 self-start gap-1.5"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span>Back</span>
      </Button>

      <Card className="shadow-card">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-success-soft text-success">
            <CreditCard className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Checkout with eSewa</CardTitle>
          <CardDescription>
            Review your reservation summary before redirecting to eSewa secure ePay.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatPrice(payment.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax / Charges</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatPrice(payment.tax_amount || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-2.5 text-base font-extrabold text-foreground">
              <span>Total Payable</span>
              <span className="text-brand tabular-nums">
                {formatPrice(payment.total_amount)}
              </span>
            </div>
          </div>

          <form
            action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
            method="POST"
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="amount" value={payment.amount} />
            <input type="hidden" name="tax_amount" value={payment.tax_amount} />
            <input type="hidden" name="total_amount" value={payment.total_amount} />
            <input
              type="hidden"
              name="transaction_uuid"
              value={payment.transaction_uuid}
            />
            <input type="hidden" name="product_code" value={payment.product_code} />
            <input type="hidden" name="product_service_charge" value="0" />
            <input type="hidden" name="product_delivery_charge" value="0" />
            <input
              type="hidden"
              name="success_url"
              value={`${origin}/payment-success`}
            />
            <input
              type="hidden"
              name="failure_url"
              value={`${origin}/payment-failure`}
            />
            <input
              type="hidden"
              name="signed_field_names"
              value="total_amount,transaction_uuid,product_code"
            />
            <input type="hidden" name="signature" value={payment.signature} />

            <Button type="submit" variant="brand" size="lg" className="w-full">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <span>Continue to eSewa</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pay;
