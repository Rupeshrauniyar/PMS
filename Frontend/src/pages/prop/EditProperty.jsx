import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2 } from "lucide-react";

import api from "../../api/client";
import PropertyFormWizard from "../../components/PropertyFormWizard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const EditProperty = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setForbidden(false);
      try {
        const res = await api.post("/api/fetching/get-my-prop", { _id: id });
        if (!cancelled) {
          if (res?.status === 200 && res.data?.Property?._id) {
            setProperty(res.data.Property);
          } else {
            setProperty(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 403 || err.response?.status === 401) {
            setForbidden(true);
          }
          setProperty(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5 py-8">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!property?._id) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Building2}
          title={forbidden ? "You don't own this listing" : "Listing not found"}
          description={
            forbidden
              ? "Only the owner who published this listing can edit its details."
              : "This property may have been deleted."
          }
          action={
            <Button asChild variant="brand">
              <Link to={id ? `/view/${id}` : "/"}>
                {id ? "View public listing" : "Go home"}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <PropertyFormWizard key={property._id} mode="edit" initialProperty={property} />;
};

export default EditProperty;
