import React, { useEffect, useState } from "react";
import SwiperComp from "../components/Swiper";
import { DoorOpen, LandPlot, Home as HomeIcon, Building2 } from "lucide-react";
import Properties from "../components/Properties";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import { Link } from "react-router-dom";
const Home = () => {
  const [activeTab, setActiveTab] = useState("Room");
  const tabs = [
    { label: "House", icon: HomeIcon, type: 1 },
    { label: "Room", icon: DoorOpen, type: 2 },
    { label: "Plot", icon: LandPlot, type: 3 },
  ];
  const [propData, setPropData] = useState([]);
  const [loading, setLoading] = useState(false);
  const defaultImages = ["./Room.webp", "./House.webp", "./Plot.webp"];
  useEffect(() => {
    const getProperty = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_backendUrl}/api/fetching/get-property`,
          {
            type: activeTab,
          }
        );
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
  }, [activeTab]);
  return (
    <div className="w-full min-h-screen font-sans pb-18 pt-28 ">
      {/* Hero Section */}
      <Link to="/search">
        <SearchBar dis={true} />
      </Link>
      <div className="pt-4"></div>
      <div className="overflow-hidden rounded-3xl  ">
        <SwiperComp images={defaultImages} />
      </div>
      <div className="pb-4"></div>

      {/* Modern Tab Navigation */}
      <div className="   flex items-center justify-center ">
        <div className="relative flex justify-center items-center w-4xl p-2 bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-full shadow-lg overflow-hidden">
          {/* Animated Indicator */}

          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                setActiveTab(tab.label);
              }}
              className={`cursor-pointer flex items-center justify-center px-3 sm:px-4 py-3 space-x-2 text-lg font-medium rounded-full transition-all duration-300 ease-in-out ${
                activeTab === tab.label
                  ? "text-zinc-900 bg-white shadow-2xl"
                  : "text-zinc-600 hover:text-zinc-800"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-sm sm:text-xl">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Property Display Section */}
      <div className="w-full   ">
        {/* <h2 className="text-3xl font-extrabold  mb-2 text-zinc-800">
          Featured {activeTab}'s
        </h2> */}

        {/* {console.log(propData)} */}
        <div className="w-full   mt-3">
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
            <div className="xl:w-[80vw] h-[400px] flex items-center justify-center flex-col  p-12 text-center">
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
      {/* <div className="pb-8"></div> */}
    </div>
  );
};

export default Home;
