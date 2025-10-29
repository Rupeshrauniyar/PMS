import { useContext, useEffect, useState } from "react";
import {
  useNavigate,
  Link,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";
import Home from "./Home";
import {
  Phone,
  Home as HomeIcon,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Bookmark,
  UserPen,
  X,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Bed,
  Bath,
  Maximize,
  ImageIcon,
} from "lucide-react";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import EditProfile from "./EditProfile";
import Recommended from "../components/Recomended";
import Signin from "./Signin";

const Book = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);

  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState("");
  const params = useParams();
  const [barPrice, setBarPrice] = useState("");
  const [isBar, setIsBar] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // const [image, setImage] = useState("");
  const location = useLocation();

  const validate = () => {
    const newErrors = {};
    if (!date || date.length === 0) {
      newErrors.date = "Appointment date is required";
    }
    if (!params.price || !barPrice || params.price === 0 || barPrice === 0) {
      newErrors.price = "Invalid price of a property";
    }
    if (!user?.phone || user?.phone.length === 0) {
      newErrors.contact = "Please provide your contact number.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmBooking = async (e) => {
    try {
      e.preventDefault();
      if (!validate()) {
        return;
      }
      setSubmitting(true);
      const Data = {
        propId: params.id,
        price: isBar ? barPrice : params.price,
        userId: user?._id,
        date,
        token: localStorage.getItem("token"),
      };
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/book`,
        Data
      );
      if (res.status === 200) {
        setUser((prev) => ({
          ...prev,
          bookedProperties: [...prev.bookedProperties, { propId: params.id }],
        }));
        setSubmitting(false);
        setSuccess(res.data.message);
      } else {
        setSubmitting(false);
      }
    } catch (err) {
      console.log(err);
      setSubmitting(false);
      setBackendError(err.response?.data.message || "Something went wrong.");
    }
  };

  useEffect(() => {
    if (barPrice.length === 0) return;
    if (params.price.toString() !== barPrice?.toString()) {
      setIsBar(true);
    } else {
      setIsBar(false);
    }
  }, [barPrice]);

  useEffect(() => {
    if (editOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [editOpen]);

  if (!params.id)
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <h3 className="text-center font-bold text-xl">
          No properties available
        </h3>
      </div>
    );

  if (user?.myProperties?.find((myProps) => myProps?.propId === params.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          Oops! Link Not Found
        </h1>
        <p className="text-gray-600 mb-6 max-w-md">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          to={`/my/${params.id}`}
          className="inline-block bg-black hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          Go to Correct Page
        </Link>
      </div>
    );
  } else if (
    user?.bookedProperties?.find((bookProps) => bookProps?.propId === params.id)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          Oops! Link Not Found
        </h1>
        <p className="text-gray-600 mb-6 max-w-md">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          to={`/booked/${params.id}`}
          className="inline-block bg-black hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          Go to Correct Page
        </Link>
      </div>
    );
  }
  return (
    <div className="w-full min-h-screen overflow-hidden xl:pt-16 pt-4 pb-26">
      {/* Alerts */}
      {success && (
        <AlertBox
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}
      {backendError && (
        <AlertBox
          message={backendError}
          type="error"
          onClose={() => setBackendError(null)}
        />
      )}

      {/* Main Content */}

      {user ? (
        <div
          id="edit"
          className=""
        >
          <EditProfile error={errors?.contact ? errors?.contact : null} />
        </div>
      ) : (
        <Signin from={location.pathname} />
      )}
      <div
        id="book"
        className="max-w-7xl animate-[slideUp_0.5s_ease-out] flex items-center justify-center"
      >
        <div className="pb-8 space-y-2 mt-4 xl:w-[40%] w-full">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Appointment Date
            </label>
            <input
              type="date"
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, date: "" }));
                setDate(e.target.value);
              }}
              className={`w-full p-3 border-2 ${
                errors.date ? "border-red-500" : "border-gray-200"
              } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              min={new Date().toISOString().split("T")[0]}
              required
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-2 flex items-center animate-bounce ">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-1 "></span>
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              Price
              {isBar && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Bargained
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ₹
              </span>
              <input
                type="text"
                value={
                  isBar
                    ? new Intl.NumberFormat("en-IN").format(barPrice)
                    : new Intl.NumberFormat("en-IN").format(params.price)
                }
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, price: "" }));
                  const rawValue = e.target.value.replace(/,/g, "");
                  if (!isNaN(rawValue)) {
                    setBarPrice(rawValue);
                  }
                }}
                className={`w-full pl-8 p-3 border-2 ${
                  errors.price ? "border-red-500" : "border-gray-200"
                } rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                required
              />
            </div>
            {!isBar && (
              <p className="text-xs text-gray-500 mt-2 italic">
                You can negotiate the price
              </p>
            )}
            {errors.price && (
              <p className="text-red-500 text-xs mt-2 flex items-center animate-bounce">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-1 "></span>
                {errors.price}
              </p>
            )}
          </div>

          <div
            className="bookingButtons z-10  flex items-center justify-between gap-2 xl:px-30 px-2  w-full  transition-all bg-white border-t border-zinc-200 p-2"
            onClick={() => {
              const element = document.getElementById("book");
              if (element) {
                element.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }}
          >
            <form
              noValidate
              onSubmit={handleConfirmBooking}
              className="w-full"
            >
              <button
                type="submit"
                className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center bg-black hover:bg-gray-800 transition-all duration-150 shadow-md hover:shadow-lg transform active:scale-95 active:shadow-inner"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirm Booking
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        {/* <Recommended prop={params.id} /> */}
      </div>
    </div>
  );
};

export default Book;
