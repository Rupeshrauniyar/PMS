import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

const PaySuccess = () => {
  const [params] = useSearchParams();
  const rawData = params.get("data");

  const decoded = useMemo(() => {
    if (!rawData) return null;
    try {
      return JSON.parse(atob(rawData));
    } catch {
      return null;
    }
  }, [rawData]);

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-14">
      <Card className="text-center shadow-card">
        <CardContent className="flex flex-col items-center gap-4 pt-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Payment Successful
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your eSewa payment has been confirmed and recorded.
            </p>
          </div>

          {decoded ? (
            <div className="w-full rounded-2xl border border-border/70 bg-muted/40 p-4 text-left text-xs">
              {decoded.total_amount ? (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatPrice(decoded.total_amount)}
                  </span>
                </div>
              ) : null}
              {decoded.transaction_code ? (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Reference Code</span>
                  <span className="selectable font-mono font-semibold text-foreground">
                    {decoded.transaction_code}
                  </span>
                </div>
              ) : null}
              {decoded.status ? (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold text-success">{decoded.status}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row">
            <Button asChild variant="brand" className="flex-1">
              <Link to="/bookings">View My Bookings</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">Explore Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaySuccess;
