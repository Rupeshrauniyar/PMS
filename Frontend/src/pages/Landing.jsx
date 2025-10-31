import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Building2, Calendar, Sparkles, Download } from "lucide-react";

const Landing = () => {
  return (
    <div className="relative min-h-screen w-full bg-white text-black overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full backdrop-blur-md bg-white/80 border-b border-zinc-200 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-3">
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <img
              src="/web-app-manifest-512x512.png"
              alt="Logo"
              className="w-10 h-10"
            />
            <h1 className="font-extrabold text-xl">PMS</h1>
          </Link>

          <div className="flex gap-3 items-center">
            <AIShinyButton to="/">Explore Properties</AIShinyButton>
            <span className="absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute top-0 left-[-75%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[20deg] animate-shine"></span>
            </span>
            <button
              className="bg-black text-white p-3 rounded-full flex gap-1 items-center justify-center"
              as="a"
              href={`${import.meta.env.VITE_backendUrl}/api/android/getapk`}
              download
            >
              <Download size={ 18} />
              Download App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col justify-center items-center text-center min-h-[70vh] px-4 mt-20 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-6xl md:text-8xl font-extrabold tracking-tight"
        >
          Buy, Sell & Rent Properties
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg md:text-2xl text-zinc-600 max-w-2xl mt-6"
        >
          The most effortless way to discover properties, connect with owners,
          and schedule visits — all in one place.
        </motion.p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <AIShinyButton to="/">Find Properties</AIShinyButton>
          <AIShinyButton
            to="/list-property"
            variant="outline"
          >
            List Your Property
          </AIShinyButton>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-3 grid-cols-1 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 bg-black text-white rounded-3xl p-8 shadow-lg flex flex-col justify-between"
        >
          <h2 className="text-4xl font-bold">Smart Property Search</h2>
          <p className="mt-3 text-lg text-gray-300">
            Discover tailored listings with our intelligent recommendation
            system.
          </p>
          <AIShinyButton
            to="/"
            className="mt-6 bg-white text-black"
          >
            <Sparkles className="mr-2 h-4 w-4" /> Try Smart Search
          </AIShinyButton>
        </motion.div>

        <BentoCard
          icon={<Home className="h-10 w-10" />}
          title="Buy or Rent"
          desc="Browse verified properties with transparent pricing."
        />
        <BentoCard
          icon={<Building2 className="h-10 w-10" />}
          title="Sell Effortlessly"
          desc="List your property and reach genuine buyers instantly."
        />
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 bg-white border border-zinc-200 rounded-3xl p-8 shadow-lg flex flex-col justify-between"
        >
          <h3 className="text-4xl font-bold">Book Visits</h3>
          <p className="mt-3 text-lg text-zinc-600">
            Schedule a visit or meeting with the owner directly. No agents. No
            hassle.
          </p>
          <AIShinyButton
            to="/appointments"
            className="mt-6"
          >
            <Calendar className="mr-2 h-4 w-4" /> Book Appointment
          </AIShinyButton>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-black text-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h4 className="text-2xl font-bold">PMS</h4>
            <p className="text-gray-400 mt-2 max-w-xs">
              The most intuitive way to explore real estate online.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href="#"
              className="text-gray-400 hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white"
            >
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ---- Black Bento Card ---- */
const BentoCard = ({ icon, title, desc }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-md flex flex-col justify-between"
  >
    <div className="text-black mb-4">{icon}</div>
    <h3 className="text-2xl font-bold">{title}</h3>
    <p className="text-zinc-600 mt-2">{desc}</p>
  </motion.div>
);

/* ---- AI Shiny Button ---- */
const AIShinyButton = ({
  to,
  as,
  children,
  className = "",
  variant = "black",
  ...props
}) => {
  const Comp = as || Link;
  return (
    <Comp
      to={to}
      {...props}
      className={`relative overflow-hidden px-6 py-3 rounded-full font-semibold text-sm flex items-center justify-center transition-all duration-300
        ${
          variant === "outline"
            ? "border border-black text-black bg-transparent hover:bg-black hover:text-white"
            : "bg-black text-white"
        } ${className}`}
    >
      {/* Shiny reflection effect */}
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span className="absolute top-0 left-[-75%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[20deg] animate-shine"></span>
      </span>
      <span className="relative z-10 flex items-center gap-1">
        <Sparkles className="h-4 w-4" /> {children}
      </span>
    </Comp>
  );
};

export default Landing;
