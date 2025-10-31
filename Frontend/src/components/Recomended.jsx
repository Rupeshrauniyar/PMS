import React, { useEffect, useState } from "react";
import { DoorOpen, LandPlot, Home as HomeIcon, Building2 } from "lucide-react";
import Properties from "./Properties";
import axios from "axios";

const Recommend = (prop) => {
  const [propData, setPropData] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const getProperty = async () => {
      try {
        setLoading(true);
        let response;
        if (prop.id) {
          response = await axios.post(
            `${import.meta.env.VITE_backendUrl}/api/fetching/get-property`,
            {
              filter: prop.id,
            }
          );
        } else {
          response = await axios.post(
            `${import.meta.env.VITE_backendUrl}/api/fetching/get-property`
          );
        }

        // console.log(response.data)
        if (response?.status === 200) {
          setLoading(false);
          setPropData(response.data.Properties);
        } else {
          setLoading(false);
          setPropData([]);
        }
      } catch (err) {
        setLoading(false);
      }
    };
    getProperty();
  }, []);
  return (
    <div className="w-full">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[{}, {}, {}].map((p, i) => (
            <div
              key={i}
              className="bg-white border border-zinc-200 rounded-3xl overflow-hidden animate-pulse h-full"
            >
              {/* Image Skeleton */}
              <div className="relative overflow-hidden aspect-video bg-zinc-200">
                <div className="absolute top-3 left-3 w-20 h-5 bg-zinc-300/60 rounded-md"></div>
              </div>

              {/* Content Section */}
              <div className="p-4">
                {/* Description */}
                <div className="w-5/6 h-3 bg-zinc-300/70 mb-2 rounded"></div>
                <div className="w-4/5 h-3 bg-zinc-200/70 mb-4 rounded"></div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-zinc-700"
                    >
                      <div className="w-4 h-4 bg-zinc-300/70 rounded"></div>
                      <div className="w-16 h-3 bg-zinc-200/70 rounded"></div>
                    </div>
                  ))}
                </div>

                {/* Price Section */}
                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                  <div className="w-24 h-4 bg-zinc-300/70 rounded"></div>
                  <div className="w-16 h-3 bg-zinc-200/70 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : propData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {propData.map((item, index) => (
            <Properties
              prop={item}
              key={index}
            />
          ))}
        </div>
      ) : (
        <div className="xl:w-[80vw]  flex items-center justify-center flex-col  p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Building2
              size={32}
              className="text-zinc-400"
            />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">
            No Properties available to recommend
          </h3>
        </div>
      )}
    </div>
  );
};

export default Recommend;
