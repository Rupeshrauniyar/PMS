import React, { useEffect, useState } from "react";
import api from "./src/api/client";

const Home = () => {
  const [type, setType] = useState("visit"); // "visit" | "pay"
  const [brokings, setBrokings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const getBrokings = async (selectedType) => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/broker/fetch/broking", {
        params: { type: selectedType },
      });
      if (res.status === 200 && res.data.brokings) {
        setBrokings(Array.isArray(res.data.brokings) ? res.data.brokings : []);
      }
    } catch (err) {
      console.log(err);
      setError("Failed to fetch brokings.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getBrokings(type);
  }, [type]);
  return (
    <div className="mt-16 px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Active Brokings</h1>

        <div className="flex rounded-lg border p-1">
          <button
            type="button"
            onClick={() => setType("visit")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              type === "visit" ? "bg-black text-white" : "text-gray-700"
            }`}
          >
            Visit
          </button>
          <button
            type="button"
            onClick={() => setType("pay")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              type === "pay" ? "bg-black text-white" : "text-gray-700"
            }`}
          >
            Pay
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4">Loading...</div>
      ) : error ? (
        <div className="mt-4 text-red-600">{error}</div>
      ) : brokings.length === 0 ? (
        <div className="mt-4 text-gray-600">
          No {type} brokings found.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {brokings.map((b) => (
            <div
              key={b?._id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {b?.propId?.title || b?.propId?.name || "Property"}
                </div>
                <div className="text-sm text-gray-600">
                  {b?.bType ? `Type: ${b.bType}` : null}
                  {b?.date ? ` • Date: ${b.date}` : null}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xs text-gray-500">Price</div>
                <div className="font-semibold">{b?.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
