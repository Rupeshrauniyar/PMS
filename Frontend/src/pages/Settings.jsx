import {
  ArrowLeft,
  Book,
  LogOut,
  Pen,
  Sun,
  TableProperties,
  User,
  ChevronRight,
  Lock,
} from "lucide-react";
import React, { useContext } from "react";
import { AppContext } from "../contexts/AppContextx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

const Settings = () => {
  const { user, setUser } = useContext(AppContext);
  const navigate = useNavigate();

  const settingsItems = [
    {
      icon: User,
      label: "Your Profile",
      action: () => navigate("/profile"),
      section: "account",
    },
    {
      icon: Pen,
      label: "Edit Profile",
      action: () => navigate("/edit-profile"),
      section: "account",
    },
    !user?.uuid
      ? {
          icon: Lock,
          label: "Change Password",
          action: () => navigate("/change-password"),
          section: "account",
        }
      : {},
    {
      icon: Sun,
      label: "Themes",
      action: () => navigate("#"),
      section: "preferences",
    },
    {
      icon: Book,
      label: "Terms & Conditions",
      action: () => navigate("#"),
      section: "legal",
    },
    {
      icon: Book,
      label: "Privacy & Policy",
      action: () => navigate("#"),
      section: "legal",
    },
  ];

  const handleSignOut = async () => {
    // await GoogleAuth.signOut();
    await axios.post(`${import.meta.env.VITE_backendUrl}/api/auth/signout`, {
      token: localStorage.getItem("token"),
      fcmToken: localStorage.getItem("fcmToken"),
    });
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="w-full min-h-screen bg-white pt-16">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900 transition-colors mb-3"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto">
        {/* Account Section */}
        <div className="px-4 py-6 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Account</h2>
          <div className="space-y-1">
            {settingsItems
              .filter((item) => item.section === "account")
              .map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center justify-between py-3 px-3 -mx-3 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                      <item.icon
                        size={18}
                        className="text-zinc-700"
                      />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-zinc-400 group-hover:text-zinc-600 transition-colors"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="px-4 py-6 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">
            Preferences
          </h2>
          <div className="space-y-1">
            {settingsItems
              .filter((item) => item.section === "preferences")
              .map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center justify-between py-3 px-3 -mx-3 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                      <item.icon
                        size={18}
                        className="text-zinc-700"
                      />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-zinc-400 group-hover:text-zinc-600 transition-colors"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* Legal Section */}
        <div className="px-4 py-6 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Legal</h2>
          <div className="space-y-1">
            {settingsItems
              .filter((item) => item.section === "legal")
              .map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center justify-between py-3 px-3 -mx-3 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                      <item.icon
                        size={18}
                        className="text-zinc-700"
                      />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-zinc-400 group-hover:text-zinc-600 transition-colors"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* Sign Out Section */}
        {user?._id && (
          <div className="px-4 py-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between py-3 px-3 -mx-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <LogOut
                    size={18}
                    className="text-red-600"
                  />
                </div>
                <span className="text-sm font-semibold">Sign Out</span>
              </div>
              <ChevronRight
                size={18}
                className="text-red-400 group-hover:text-red-600 transition-colors"
              />
            </button>
          </div>
        )}

        {/* App Info */}
        <div className="px-4 py-6 text-center border-t border-zinc-200">
          <p className="text-xs text-zinc-500">Version 1.0.0</p>
          <p className="text-xs text-zinc-400 mt-1">
            © 2024 Property Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
