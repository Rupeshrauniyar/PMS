import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[65svh] items-center justify-center py-10">
      <EmptyState
        icon={Compass}
        title="404 — Page not found"
        description="The broker console screen you requested doesn't exist or may have moved."
        action={
          <>
            <Button variant="brand" asChild>
              <Link to="/">Back to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pool">Open Pool</Link>
            </Button>
          </>
        }
        className="w-full max-w-md"
      />
    </div>
  );
}
