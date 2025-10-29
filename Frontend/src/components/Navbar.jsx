import React, { useState, useEffect, useContext } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { Home, HousePlus, Plus, Search, Settings, User2 } from "lucide-react";
import { AppContext } from "../contexts/AppContextx";

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
      icon: Home,
    },
    {
      path: "/search",
      name: "Search",
      icon: Search,
    },
    {
      path: "/add-property",
      name: "Add property",
      icon: Plus,
    },
    {
      path: "/profile",
      name: "Profile",
      icon: User2,
    },
  ];
  return location.pathname === "/signup" ||
    location.pathname === "/signin" ? null : (
    <>
      {/* Top Nav */}
      <div
        className={`w-full fixed top-0  right-0 z-90 transition-transform duration-300 ${
          show ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* {console.log(user.displayName)} */}
        <div className=" ">
          <div className="h-18  bg-white/70 backdrop-blur-xl border border-zinc-200/60  shadow-lg px-2 flex items-center justify-between">
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
                    <button className=" rounded-full hover:bg-zinc-100 transition-colors flex gap-1 items-center justify-center">
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
                    className="hidden sm:block px-2 py-1 sm:px-3 sm:py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className=" px-5 py-3 sm:px-4 sm:py-2 text-sm font-semibold bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile bottombar*/}
      <div
        className={`block xl:hidden fixed bottom-0 left-0 right-0 z-35 transition-transform duration-300 `}
      >
        {/* {console.log(user.displayName)} */}
        <div className="max-w-6xl ">
          <div className="h-15  bg-white/70 backdrop-blur-xl border border-zinc-200/60  shadow-lg  flex items-center justify-around">
            {/* Left: Menu + Logo */}
            {navLinks.map((navLink, index) => (
              <NavLink
                key={index}
                state={{ from: location.pathname }}
                to={navLink.path}
                className={({ isActive }) => `
                flex items-center justify-center px-5 py-4  rounded-xl transition-all duration-200
                ${
                  isActive
                    ? " bg-black text-white   hover:bg-zinc-900"
                    : " text-gray-700  hover:bg-gray-100"
                }
              `}
              >
                <navLink.icon className="w-5 h-5 " />
                {/* <span className="font-medium">{navLink.name}</span> */}
              </NavLink>
            ))}
            <NavLink
              to="settings"
              className={({ isActive }) => `
                flex items-center justify-center px-5 py-4  rounded-xl transition-all duration-200
                ${
                  isActive
                    ? " bg-black text-white   hover:bg-zinc-900"
                    : " text-gray-700  hover:bg-gray-100"
                }
              `}
            >
              <Settings />
            </NavLink>
          </div>
        </div>
      </div>
      {/* Desktop sidebar*/}
      <div className="hidden xl:block fixed left-0 top-0 h-full w-[20%]  text-black bg-white shadow-md z-40 ">
        <div className="w-full p-2 border-b-2 border-zinc-200">
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
                    ? " bg-black text-white   hover:bg-zinc-900"
                    : " text-gray-700  hover:bg-gray-100"
                }
              `}
            >
              <navLink.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{navLink.name}</span>
            </NavLink>
          ))}

          {/* Divider */}
          <div className="border-t border-gray-200 my-4"></div>

          {/* Settings Link */}
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center px-4 py-3 my-1 rounded-xl transition-all duration-200
              ${
                isActive
                  ? " bg-black text-white  hover:bg-zinc-900"
                  : " text-gray-700  hover:bg-gray-100"
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
