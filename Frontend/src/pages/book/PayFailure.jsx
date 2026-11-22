import React from "react";
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PayFailure = () => {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-foreground">
        <XCircle className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Payment not completed</h1>
      <p className="text-sm text-muted-foreground">
        No amount was charged. You can retry anytime from your booking.
      </p>
      <Button asChild className="mt-2 rounded-full px-6">
        <Link to="/profile">Back to bookings</Link>
      </Button>
    </div>
  );
};

export default PayFailure;
