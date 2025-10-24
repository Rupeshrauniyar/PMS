import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../contexts/AppContextx";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  User,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Building2,
} from "lucide-react";
import Properties from "../components/Properties";
import axios from "axios";

const Profile = () => {
  const { user } = useContext(AppContext);
  const [myProp, setMyProp] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getMyProps = async () => {
      if (user?.myProperties?.length < 1) return;
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/get-user-property`,
        {
          token: localStorage.getItem("token"),
          id: user.id,
        }
      );
      console.log(res.data);
      if (res.status === 200) {
        setMyProp(res.data.prop);
      }
    };
    getMyProps();
  }, [user]);

  return (
    <div className="w-full min-h-screen pt-20 ">
      {/* Cover Photo Section */}
      {/* <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-64 relative">
        <div className="absolute inset-0 bg-black/10"></div>
      </div> */}

      {/* Main Content  */}
      <div className=" mx-auto  pb-8">
        {/* Profile Card */}
        <div className="   mb-6">
          {/* Profile Header */}
          <div className=" pt-6 pb-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              {/* Profile Picture & Name */}
              <div className="flex flex-col md:flex-row items-center gap-6 mb-4 md:mb-0">
                {user?.pp ? (
                  <img
                    src={user.pp}
                    alt="Profile"
                    className="w-40 h-40 rounded-full  object-cover border-4 border-white shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center border-4 border-white shadow-xl">
                    <User
                      size={64}
                      className="text-zinc-500"
                    />
                  </div>
                )}

                <div className="text-center md:text-left mb-4 md:mb-2">
                  <h1 className="text-3xl font-bold text-zinc-900 mb-1">
                    {user?.username || "Guest User"}
                  </h1>
                  <p className="text-zinc-600 text-lg">Property Owner</p>
                  {user?.location && (
                    <div className="flex items-center justify-center md:justify-start gap-1 mt-2 text-zinc-500">
                      <MapPin size={16} />
                      <span className="text-sm">{user.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Profile Button */}
              <button
                onClick={() => navigate("/edit-profile")}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg self-center md:self-auto"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-200"></div>

          {/* Contact Information */}
          <div className=" py-6">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail
                    size={20}
                    className="text-blue-600"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-sm text-zinc-900 font-medium truncate">
                    {user?.email || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Phone
                    size={20}
                    className="text-green-600"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                    Phone
                  </p>
                  <p className="text-sm text-zinc-900 font-medium">
                    {user?.phone || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Calendar
                    size={20}
                    className="text-purple-600"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                    Member Since
                  </p>
                  <p className="text-sm text-zinc-900 font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "Recently joined"}
                  </p>
                </div>
              </div>

              {/* Total Properties */}
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Building2
                    size={20}
                    className="text-orange-600"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                    Properties Listed
                  </p>
                  <p className="text-sm text-zinc-900 font-medium">
                    {myProp?.length || 0}{" "}
                    {myProp?.length === 1 ? "Property" : "Properties"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 pb-12">
          {myProp.length > 0 ? (
            myProp.map((item, index) => (
              <Properties
                prop={item}
                key={index}
              />
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
                No Properties Yet
              </h3>
              <p className="text-zinc-600 mb-6">
                Start by adding your first property listing
              </p>
              <button
                onClick={() => navigate("/add-property")}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2"
              >
                <Building2 size={18} />
                Add Property
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
