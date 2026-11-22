import React from "react";
import { Link } from "react-router-dom";
import { Compass, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const NotFound = () => {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={Compass}
        title="404 — Page not found"
        description="The page or listing you're looking for may have moved or no longer exists."
        action={
          <>
            <Button asChild variant="brand">
              <Link to="/">Back to Explore</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/search">
                <Search className="size-4" aria-hidden="true" />
                <span>Search properties</span>
              </Link>
            </Button>
          </>
        }
      />
    </div>
  );
};

export default NotFound;
