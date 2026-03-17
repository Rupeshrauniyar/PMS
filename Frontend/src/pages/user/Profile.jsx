import React, { useContext, useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import Properties from "../../components/Properties";
import axios from "axios";

const Profile = () => {
  const { user } = useContext(AppContext);
  const [myProp, setMyProp] = useState([]);
  const [Type, setType] = useState(null);

  const btnMap = [
    { type: "myProperties", backType: null, text: "My Properties" },
    { type: "bookedProperties", backType: "propId", text: "Booked Properties" },
    { type: "saved", backType: null, text: "Saved" },
  ];

  const navigate = useNavigate();

  const HandleType = async (e, backType) => {
    setType(e);

    if (!user?.[e] || user[e].length < 1) {
      setMyProp([]);
      return;
    }

    const res = await axios.post(
      `${import.meta.env.VITE_backendUrl}/api/fetching/get-user-property`,
      {
        token: localStorage.getItem("token"),
        Type: e,
        NestedPop: backType,
      },
    );

    if (res.status === 200) {
      setMyProp(res.data.properties);
    } else {
      setMyProp([]);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black text-black dark:text-white pt-40">
      {/* COVER */}
      {/* <div className="w-full h-56 bg-gradient-to-r from-black via-zinc-900 to-black"></div> */}

      {/* PROFILE HEADER */}
      <div className="max-w-5xl mx-auto ">
        <div className="relative -mt-20 flex flex-col md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-6">
            {user?.pp ? (
              <img
                src={user.pp}
                className="w-36 h-36 rounded-full border-4 border-white dark:border-black object-cover shadow-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-36 h-36 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border-4 border-white dark:border-black">
                <User size={48} />
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold">
                {user?.username || "Guest User"}
              </h1>

              <p className="text-zinc-500">Property Owner</p>

              {user?.location && (
                <div className="flex items-center gap-1 text-zinc-500 mt-1">
                  <MapPin size={14} />
                  {user.location}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/edit-profile")}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-xl font-medium hover:opacity-90"
          >
            <Edit2 size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="max-w-5xl mx-auto  mt-8 grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-xl font-bold">{user?.myProperties?.length || 0}</p>
          <p className="text-sm text-zinc-500">Properties</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-xl font-bold">
            {user?.bookedProperties?.length || 0}
          </p>
          <p className="text-sm text-zinc-500">Bookings</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-xl font-bold">{user?.saved?.length || 0}</p>
          <p className="text-sm text-zinc-500">Saved</p>
        </div>
      </div>

      {/* CONTACT INFO */}
      <div className="max-w-5xl mx-auto  mt-8 grid md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
          <Mail size={18} />
          <div>
            <p className="text-xs text-zinc-500">Email</p>
            <p className="text-sm font-medium">
              {user?.email || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
          <Phone size={18} />
          <div>
            <p className="text-xs text-zinc-500">Phone</p>
            <p className="text-sm font-medium">
              {user?.phone || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
          <Calendar size={18} />
          <div>
            <p className="text-xs text-zinc-500">Member Since</p>
            <p className="text-sm font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "Recently Joined"}
            </p>
          </div>
        </div>
      </div>

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
