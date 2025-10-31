import axios from "axios";
import { Building2, Search as SearchIcon } from "lucide-react";
import React, { useState } from "react";
import Properties from "../components/Properties";
const Search = () => {
  const [value, setValue] = useState("");
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleSearch = async (e) => {
    try {
      setLoading(true);
      setValue(e.target.value);
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/fetching/search`,
        {
          value: e.target.value,
        }
      );
      if (res.data.props) {
        setLoading(false);
        setProps(res.data.props);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
    // console.log(e.target.value);

    // console.log(res.data);
    // console.log(e.target.value);
  };
  return (
    <div className="w-full min-h-screen pt-20">
      <div
        className={` 
      transition-all  `}
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-full shadow-lg">
            <SearchIcon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              size={20}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleSearch(e)}
              className="w-full py-3 pl-12 pr-4 rounded-full bg-transparent focus:outline-none text-zinc-800 placeholder-zinc-400"
              placeholder="Search for houses, rooms, plots…"
            />
          </div>
        </div>
      </div>
      <div className="pt-3 w-full  ">
        {value.length < 1 ? (
          <div className="xl:w-[80vw]  flex items-center justify-center flex-col  p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <SearchIcon
                size={32}
                className="text-zinc-400"
              />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              Enter keywords to search.
            </h3>
          </div>
        ) : loading ? (
          [{}, {}, {}].map((p, i) => (
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
          ))
        ) : props?.length > 0 ? (
          <span className="pb-20 grid xl:grid-cols-3 grid-cols-1 gap-3">
            {props.map((prop, i) => (
              <Properties
                prop={prop}
                key={i}
              />
            ))}
          </span>
        ) : (
          <div className="xl:w-[80vw]  flex items-center justify-center flex-col  p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <Building2
                size={32}
                className="text-zinc-400"
              />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              No Properties available yet
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
