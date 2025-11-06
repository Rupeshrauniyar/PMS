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
  TypeIcon,
  CircleSlash,
  ChevronDown,
  ChevronUp,
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
  const [select, setSelect] = useState("pay");
  const [note, setNote] = useState("pay");

  const params = useParams();
  const [barPrice, setBarPrice] = useState(null);
  const [isBar, setIsBar] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [open, setOpen] = useState(true);

  // const [image, setImage] = useState("");
  const location = useLocation();

  const validate = () => {
    const newErrors = {};
    if (!params.price || params.price === 0) {
      newErrors.price = "Invalid price of a property";
    }
    if (!barPrice) {
    } else if (barPrice === "0" || !barPrice || barPrice === "00") {
      newErrors.price = "Invalid price of a property";
    }
    if (select !== "pay" && !date) {
      newErrors.date = "Invalid date for Visit";
    }
    // console.log(barPrice);
    // if (barPrice && !barPrice > 0) {
    //   newErrors.price = "Invalid price of a property";
    // }
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
        note,
        bType: select,
        token: localStorage.getItem("token"),
      };
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/booking/book`,
        Data
      );
      if (res.status === 200) {
        setUser((prev) => ({
          ...prev,
          bookedProperties: [
            ...prev.bookedProperties,
            { propId: params.id, price: barPrice ? barPrice : params.price },
          ],
        }));
        setSubmitting(false);
        setSuccess(res.data.message);
        navigate(`/booked/${params.id}`);
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
    if (!barPrice) return;
    if (params.price.toString() !== barPrice?.toString()) {
      setIsBar(true);
    } else {
      setIsBar(false);
    }
  }, [barPrice]);

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
    <div className="w-full min-h-screen overflow-hidden xl:pt-16 pt-24 pb-26">
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
        <div className="flex flex-col">
          <div
            className="w-full bg-black text-white px-2 py-4 rounded-xl flex items-center justify-between"
            onClick={() => {
              if (open) {
                setOpen(false);
              } else {
                setOpen(true);
              }
            }}
          >
            <strong className="">
              <span className="mr-1 bg-white rounded-md text-black px-3 py-2">
                1
              </span>
              CHECK CREDENTIALS
            </strong>
            <span>
              <ChevronUp className={`${open ? "" : "rotate-180"}`} />
            </span>
          </div>
          <div
            id="edit"
            className={`w-full overflow-hidden  ${open ? "h-full" : "h-0"}`}
          >
            <EditProfile
              error={errors?.contact ? errors?.contact : null}
              className=""
            />
            <button
              className="bg-black text-white rounded-xl w-full p-3 "
              onClick={() => setOpen(false)}
            >
              <span className="flex gap-1 text-center items-center justify-center">
                Continue <ChevronRight />
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="w-full bg-black text-white px-2 py-4 rounded-xl flex items-center justify-between">
            <strong className="">
              <span className="mr-1 bg-white rounded-md text-black px-3 py-2">
                1
              </span>
              LOGIN OR SIGNUP{" "}
            </strong>
            <span>
              <ChevronUp />
            </span>
          </div>
          <div className="h- mt-4">
            <Signin from={location.pathname} />
          </div>
        </div>
      )}
      <div
        id="book"
        className="max-w-7xl  animate-[slideUp_0.5s_ease-out] flex flex-col mt-4"
      >
        <div
          className="w-full bg-black text-white px-2 py-4 rounded-xl flex items-center justify-between"
          onClick={() => {
            if (!open) {
              setOpen(true);
            } else {
              setOpen(false);
            }
          }}
        >
          <strong className="">
            <span className="mr-1 bg-white rounded-md text-black px-3 py-2">
              2
            </span>
            BOOKING PREFRENCES
          </strong>
          <span>
            <ChevronUp className={`${!open ? "" : "rotate-180"}`} />
          </span>
        </div>
        {user ? (
          <div
            className={` space-y-2 xl:w-[40%] w-full mt-4 ${
              !open ? "h-full" : "h-0"
            } overflow-hidden`}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold"></span>
              <select
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, select: "" }));
                  setSelect(e.target.value);
                }}
                className={`w-full px-2 py-3 border-2 ${
                  errors.select ? "border-red-500" : "border-gray-200"
                } rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              >
                <option value={"pay"}>Pay Now</option>
                <option value={"visit"}>Visit property</option>
              </select>
            </div>
            {select !== "pay" ? (
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
            ) : (
              <></>
            )}

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
                    if (e.target.value.trim()) {
                      console.log(e.target.value);
                      setErrors((prev) => ({ ...prev, price: "" }));
                      const rawValue = e.target.value.replace(/,/g, "");
                      if (!isNaN(rawValue)) {
                        setBarPrice(rawValue);
                      }
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
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                Note (optional)
              </label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold"></span>
              <input
                onChange={(e) => {
                  // setErrors((prev) => ({ ...prev, select: "" }));
                  setNote(e.target.value);
                }}
                className={`w-full px-2 py-3 border-2 
              "border-red-500
               rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              />
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
        ) : null}
      </div>
    </div>
  );
};

export default Book;
