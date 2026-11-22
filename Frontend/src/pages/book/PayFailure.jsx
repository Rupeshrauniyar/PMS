import React from "react";
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PayFailure = () => {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-14">
      <Card className="text-center shadow-card">
        <CardContent className="flex flex-col items-center gap-4 pt-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-danger-soft text-destructive">
            <XCircle className="size-7" aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Payment Cancelled or Failed
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              No charges were completed. You can retry the payment anytime from your bookings page.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row">
            <Button asChild variant="brand" className="flex-1">
              <Link to="/bookings">Back to Bookings</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayFailure;
