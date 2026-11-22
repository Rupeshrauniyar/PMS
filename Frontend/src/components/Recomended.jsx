import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import Properties, { PropertyCardSkeleton } from "./Properties";
import { EmptyState } from "@/components/ui/empty-state";
import api from "../api/client";

const Recommend = ({ id }) => {
  const [propData, setPropData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const getProperty = async () => {
      try {
        setLoading(true);
        const payload = id ? { filter: id } : { recent: true, limit: 6 };
        const response = await api.post("/api/fetching/get-property", payload);
        if (!cancelled) {
          setPropData(
            response?.status === 200 ? response.data?.Properties || [] : [],
          );
        }
      } catch {
        if (!cancelled) setPropData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    getProperty();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const valid = propData.filter((item) => item?._id);
  if (valid.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No similar properties right now"
        description="Check back soon as new listings are added daily."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
      {valid.map((item) => (
        <Properties prop={item} key={item._id} />
      ))}
    </div>
  );
};

export default Recommend;
