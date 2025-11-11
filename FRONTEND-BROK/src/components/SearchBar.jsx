import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SearchBar = (props) => {
  const [show, setShow] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > scrollY) {
        setShow(false);
      } else {
        setShow(true);
      }
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollY]);
  return (
    <>
      {/* {console.log(props)} */}

      <div
        className={`fixed  xl:left-22 left-0 right-0 ${
          show ? "top-20" : "top-2"
        } transition-all px-2 z-[999]`}
      >
        <div className="max-w-xl mx-auto">
          <Link to="/search">
            <div className="relative bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-full shadow-lg">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                size={20}
              />
              <input
                type="text"
                value={props.value}
                readOnly={props.dis ? true : false}
                className="w-full py-3 pl-12 pr-4 rounded-full bg-transparent focus:outline-none text-zinc-800 placeholder-zinc-400"
                placeholder="Search for houses, rooms, plots…"
              />
            </div>
          </Link>
        </div>
      </div>

      {/* <div className="pb-28"></div> */}
    </>
  );
};

export default SearchBar;
