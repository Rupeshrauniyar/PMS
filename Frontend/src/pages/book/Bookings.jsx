import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  User,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Building2,
  Plus,
  ChevronDown,
} from "lucide-react";
import Properties from "../../components/Properties";
import axios from "axios";

const Profile = () => {
  const { user } = useContext(AppContext);
  const [myProp, setMyProp] = useState([]);
  const [Type, setType] = useState(null);
  const btnMap = [
    {
      type: "myProperties",
      backType: null,
      text: "My Properties",
    },
    {
      type: "bookedProperties",
      backType: "propId",
      text: "Booked Properties",
    },
    ,
    {
      type: "saved",
      backType: null,
      text: "Saved",
    },
  ];
  const navigate = useNavigate();

  const HandleType = async (e, backType) => {
    setType(e);
    if (user[e].length < 1) return setMyProp([]);
    console.log(backType);
    const res = await axios.post(
      `${import.meta.env.VITE_backendUrl}/api/fetching/get-user-property`,
      {
        token: localStorage.getItem("token"),
        Type: e,
        NestedPop: backType,
      },
    );
    // console.log(res.data.properties);
    if (res.status === 200) {
      setMyProp(res.data.properties);
    } else {
      setMyProp([]);
    }
  };
  return (
    <div className="w-full min-h-screen pt-20 ">
      {/* Cover Photo Section */}
      {/* <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-64 relative">
        <div className="absolute inset-0 bg-black/10"></div>
      </div> */}

      {/* Main Content  */}
      <div className=" mx-auto  pb-8">
        {/* Profile Card */}
       
        <div className="flex gap-3 min-w-full overflow-x-auto no-scrollbar py-2 px-1">
          {btnMap.map((btn, i) => (
            <button
              key={i}
              onClick={() => HandleType(btn.type, btn.backType)}
              className={`px-5 py-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 border 
        ${
          btn.type === Type
            ? "bg-black text-white border-black shadow-md scale-105"
            : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400"
        }`}
            >
              {btn.text}
            </button>
          ))}
        </div>

        <div className="w-full  grid grid-cols-1  gap-3 mt-3 pb-12">
          {Type ? (
            myProp.length > 0 ? (
              myProp.map((item, index) => (
                <div key={index}>
                  {item.propId ? (
                    <Properties prop={item.propId} />
                  ) : (
                    <>
                      <div className="w-full h-50 bg-white border border-zinc-200 rounded-3xl overflow-hidden hover:border-zinc-400 transition-all duration-200 group flex items-center justify-center text-zinc-600 text-lg font-medium">
                        This property is no longer available.
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="   p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                  <Building2
                    size={32}
                    className="text-zinc-400"
                  />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                  No Properties available
                </h3>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center">
              <button
                className="flex items-center justify-center cursor-pointer group"
                onClick={() => HandleType("myProperties")}
              >
                <ChevronDown className="mr-1" />
                <h3>Load Properties</h3>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
