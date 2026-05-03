import React, { useContext, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  Edit2,
  Building2,
  BookMarked,
  Heart,
  Loader2,
} from "lucide-react";
import Properties from "../../components/Properties";
import api from "../../api/client";

const tabs = [
  { type: "myProperties", backType: null, label: "My Listings", icon: Building2 },
  { type: "bookedProperties", backType: "propId", label: "Booked", icon: BookMarked },
  { type: "saved", backType: null, label: "Saved", icon: Heart },
];

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-zinc-100 last:border-0">
    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
      <Icon className="w-3.5 h-3.5 text-zinc-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-medium text-black truncate">{value || "Not provided"}</p>
    </div>
  </div>
);

const Profile = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const [myProp, setMyProp] = useState([]);
  const [activeType, setActiveType] = useState(null);
  const [loading, setLoading] = useState(false);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  const activeTab = tabs.find((t) => t.type === activeType);

  const handleTab = async (type, backType) => {
    if (activeType === type) return;
    setActiveType(type);
    setMyProp([]);

    if (!user?.[type] || user[type].length < 1) return;

    try {
      setLoading(true);
      const res = await api.post("/api/fetching/get-user-property", {
        Type: type,
        NestedPop: backType,
      });
      if (res.status === 200) {
        setMyProp(res.data.properties);
      } else {
        setMyProp([]);
      }
    } catch {
      setMyProp([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white pt-20 pb-16">

      {/* ── Avatar + Name + Edit ── */}
      <div className="flex items-center gap-4 mb-6">
        {user?.pp ? (
          <img
            src={user.pp}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full object-cover border border-zinc-200 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-black truncate">
            {user?.username || "Guest User"}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Property Owner</p>
        </div>

        <button
          onClick={() => navigate("/edit-profile")}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold border border-zinc-200 px-4 py-2 rounded-full hover:bg-zinc-50 transition-colors text-zinc-600"
        >
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 divide-x divide-zinc-100 border border-zinc-100 rounded-2xl overflow-hidden mb-6">
        {[
          { label: "Listings", count: user?.myProperties?.length ?? 0 },
          { label: "Booked", count: user?.bookedProperties?.length ?? 0 },
          { label: "Saved", count: user?.saved?.length ?? 0 },
        ].map(({ label, count }) => (
          <div key={label} className="flex flex-col items-center py-4">
            <span className="text-xl font-bold text-black">{count}</span>
            <span className="text-xs text-zinc-400 mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Contact Info ── */}
      <div className="border border-zinc-100 rounded-2xl px-4 mb-6">
        <InfoRow icon={Mail} label="Email" value={user?.email} />
        <InfoRow icon={Phone} label="Phone" value={user?.phone} />
        <InfoRow
          icon={Calendar}
          label="Member Since"
          value={
            user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : "Recently joined"
          }
        />
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-zinc-100 mb-5" />

      {/* ── Tab Bar ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {tabs.map(({ type, backType, label, icon: Icon }) => {
          const isActive = activeType === type;
          const count = user?.[type]?.length ?? 0;
          return (
            <button
              key={type}
              onClick={() => handleTab(type, backType)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                isActive
                  ? "bg-black text-white border-black"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count > 0 && (
                <span
                  className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {!activeType ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600">
            Select a tab to view properties
          </p>
          <p className="text-xs text-zinc-400 mt-1">My Listings, Booked, or Saved</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      ) : myProp.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
            {activeTab?.label} · {myProp.length}
          </p>
          {myProp.map((item, index) => (
            <div key={index}>
              {item.propId ? (
                <Properties prop={item.propId} />
              ) : (
                <div className="w-full py-5 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center">
                  <p className="text-sm text-zinc-400">
                    This property is no longer available.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {activeTab && (
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <activeTab.icon className="w-5 h-5 text-zinc-400" />
            </div>
          )}
          <p className="text-sm font-medium text-zinc-600">
            No {activeTab?.label?.toLowerCase()} yet
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {activeType === "myProperties"
              ? "Properties you list will appear here."
              : activeType === "bookedProperties"
              ? "Properties you book will appear here."
              : "Properties you save will appear here."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;