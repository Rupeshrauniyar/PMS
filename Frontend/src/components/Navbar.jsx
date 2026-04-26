import React, { useState, useEffect, useContext } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import {
  Book,
  Home,
  Menu,
  PlaySquare,
  Plus,
  Search,
  Settings,
  User2,
} from "lucide-react";
import {
  HomeIcon as HomeOutline,
  ClipboardDocumentListIcon as ClipboardOutline,
  Bars3Icon as MenuOutline,
  PlayIcon as PlayOutline,
  PlusCircleIcon  as PlusOutline,
  MagnifyingGlassIcon as SearchOutline,
  Cog6ToothIcon as SettingsOutline,
  UserIcon as UserOutline,
} from "@heroicons/react/24/outline";

import {
  HomeIcon as HomeSolid,
  ClipboardDocumentListIcon as ClipboardSolid,
  Bars3Icon as MenuSolid,
  PlayIcon as PlaySolid,
  PlusCircleIcon  as PlusSolid,
  MagnifyingGlassIcon as SearchSolid,
  Cog6ToothIcon as SettingsSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";
import { AppContext } from "../contexts/AppContext";

const Navbar = () => {
  const [show, setShow] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const { user } = useContext(AppContext);
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      if (window.scrollY > scrollY) {
        setShow(false);
      } else {
        setShow(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  const location = useLocation();

  const navLinks = [
    {
      path: "/",
      name: "Home",
      outline: HomeOutline,
      solid: HomeSolid,
    },
    {
      path: "/bookings",
      name: "Bookings",
      outline: ClipboardOutline,
      solid: ClipboardSolid,
    },
    {
      path: "/add-property",
      name: "Add ",
      outline: PlusOutline,
      solid: PlusSolid,
    },
    {
      path: "/search",
      name: "Search",
      outline: SearchOutline,
      solid: SearchSolid,
    },
    {
      path: "/profile",
      name: "Profile",
      outline: UserOutline,
      solid: UserSolid,
    },
  ];
  return location.pathname === "/signup" ||
    location.pathname === "/signin" ||
    location.pathname === "/reels" ||
    location.pathname === "/intro" ? null : (
    <>
      {/* Top Nav */}
      <div
        className={`xl:w-[75%] w-full fixed top-0  right-0 z-[2000] transition-transform duration-300 ${
          show ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* {console.log(user.displayName)} */}
        <div className=" ">
          <div className="h-19 bg-background/70 backdrop-blur-xl border border-border shadow-lg px-2 flex items-center justify-between">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2"
              >
                <img
                  className="w-12 h-12  object-contain ml-[4px]"
                  src="/web-app-manifest-512x512.png"
                  alt="Logo"
                />
              </Link>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  <Link to="/profile">
                    <button className="rounded-full hover:bg-accent transition-colors flex gap-1 items-center justify-center p-2 cursor-pointer">
                      {user?.pp?.length > 0 ? (
                        <img
                          className="w-6 h-6 object-cover rounded-full"
                          src={user.pp}
                          alt="profile"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User2 size={20} />
                      )}

                      <span className="font-semibold  truncate">
                        {user.username}
                      </span>
                    </button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    to="/signin"
                    className="hidden sm:block px-2 py-1 sm:px-3 sm:py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-3 sm:px-4 sm:py-2 text-sm font-semibold bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
              <NavLink
                to="settings"
                className={({ isActive }) => `
                   transition-all duration-200
                ${
                  isActive
                    ? "font-extrabold text-foreground hover:text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
              >
                <Menu />
              </NavLink>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile bottombar*/}
      <div
        className={`block xl:hidden fixed bottom-0 left-0 right-0 z-[2000] transition-transform duration-300 `}
      >
        {/* {console.log(user.displayName)} */}
        <div className="max-w-6xl ">
          <div className="h-14 bg-background/70 backdrop-blur-xl border border-border shadow-lg flex items-center justify-between px-4">
            {/* Left: Menu + Logo */}
            {navLinks.map((navLink, index) => (
              <NavLink
                key={index}
                to={navLink.path}
                className="flex items-center justify-center"
              >
                {({ isActive }) => {
                  const Icon = isActive ? navLink.solid : navLink.outline;

                  return (
                    <span className="flex items-center justify-center flex-col">
                    
                    <Icon
                      className={`w-6 h-6 transition-all duration-200 ${
                        isActive
                          ? "text-foreground scale-110"
                          : "text-muted-foreground"
                      }`}
                    />
                    <p className={`font-medium text-xs text-center ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{navLink.name}</p>
                    </span>

                  );
                }}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      {/* Desktop sidebar*/}
      <div className="hidden xl:block fixed left-22 top-0 h-full w-[25%] bg-background text-foreground  z-[2000] border-r border-border">
        <div className="w-full p-2 border-b border-border">
          <h3 className="font-bold text-3xl  ">Sidebar</h3>
          <p>Navigate through pages.</p>
        </div>

        <div className="flex flex-col h-full px-2 ">
          {navLinks.map((navLink, index) => (
            <NavLink
              key={index}
              to={navLink.path}
              className={({ isActive }) => `
                flex items-center px-4 py-3 my-1 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }
              `}
            >
              <navLink.outline className="w-5 h-5 mr-3" />
              <span className="font-medium">{navLink.name}</span>
            </NavLink>
          ))}

          {/* Divider */}
          <div className="border-t border-border my-4"></div>

          {/* Settings Link */}
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center px-4 py-3 my-1 rounded-xl transition-all duration-200
              ${
                isActive
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }
            `}
          >
            <Settings className="w-5 h-5 mr-3" />
            <span className="font-medium">Settings</span>
          </NavLink>

          {/* Logout Link */}
        </div>
      </div>
    </>
  );
};

export default Navbar;
