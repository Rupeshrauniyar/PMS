import { useContext, useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";

import {
  Phone,
  Mail,
  Home,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Bookmark,
  UserPen,
  X,
} from "lucide-react";
import Properties from "../components/Properties";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import EditProfile from "./EditProfile";
const ViewProp = () => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState("");
  const params = useParams();
  const [barPrice, setBarPrice] = useState("");
  const [isBar, setIsBar] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [show, setShow] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // console.log(params);
    const getProperty = async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/get-property`,
        {
          _id: params.id,
        }
      );
      // console.log(response);
      if (response?.status === 200 && response.data.Property._id) {
        setPropData(response.data.Property);
        setBarPrice(response.data.Property.price);
      } else {
        setPropData({});
      }
      setPropertyLoading(false);
    };
    getProperty();
  }, [params.id]);

  const validate = () => {
    const newErrors = {};
    if (!date || date.length === 0) {
      newErrors.date = "Appointment date is required";
    }
    if (!props.price || !barPrice || props.price === 0 || barPrice === 0) {
      newErrors.price = "Invalid price of a property";
    }
    if (!user.phone || user.phone.length === 0) {
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
        price: isBar ? barPrice : props?.price,
        userId: user?._id,
        date,
        token: localStorage.getItem("token"),
      };
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/book`,
        Data
      );
      if (res.status === 200) {
        setSubmitting(false);
        setSuccess(res.data.message);
      } else {
        setSubmitting(false);
      }
    } catch (err) {
      setSubmitting(false);
      // console.log(err);
      setBackendError(err.response.data.message);
    }
  };

  useEffect(() => {
    const handleScroll = (e) => {
      setScrollY(window.scrollY);
      if (scrollY > window.scrollY) {
        setShow(false);
      } else {
        setShow(true);
      }
    };
    document.addEventListener("scroll", handleScroll);
  }, [scrollY]);
  useEffect(() => {
    if (barPrice.length === 0) return;
    if (props?.price?.toString() !== barPrice?.toString()) {
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
  return (
    <div className=" min-h-screen w-full overflow-hidden pb-20 mt-16">
      {/* {console.log(user.phone)} */}
      {editOpen ? (
        <>
          <div className="xl:w-[60%] xl:ml-[30%] ml-0 w-[96%] h-[650px] top-0 left-2 flex flex-col fixed z-30 items-center justify-center overflow-hidden xl:mt-15 mt-10">
            <div className=" w-full h-[80%] bg-white  px-2 rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between mt-6 mb-4">
                <span className="text-xl font-semibold">Edit Profile</span>
                <X
                  size={26}
                  onClick={() => setEditOpen(false)}
                  className=" cursor-pointer"
                />
              </div>

              <EditProfile className="" />
            </div>
          </div>

          <div className="fixed top-0 left-0 w-full h-full bg-black/80 z-20 "></div>
        </>
      ) : (
        <></>
      )}
      {/* Back button */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className=" flex items-center text-gray-900 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <button className="">
          <Bookmark />
        </button>
      </div>
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
      {propertyLoading ? (
        <div className="mt-4 flex flex-col items-center justify-center">
          {/* Skeleton for Property Card */}
          <div className="xl:w-2xl w-full animate-pulse">
            <div className="bg-gray-200 h-60 rounded-xl mb-4"></div>
            <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded-md w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded-md w-full mb-4"></div>
          </div>

          <div className="xl:w-6xl md:w-3xl md:px-5 w-full md:flex justify-center gap-4">
            {/* Skeleton for Booking Details */}
            <div className="max-h-sm rounded-xl shadow-md mb-6 bg-white w-full animate-pulse">
              <div className="p-6 border-b border-zinc-200 bg-white rounded-t-xl">
                <div className="h-8 bg-gray-200 rounded-md w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
              </div>
              <div className="p-6 space-y-6 bg-white rounded-b-xl">
                <div className="h-10 bg-gray-200 rounded-md w-full"></div>
                <div className="h-10 bg-gray-200 rounded-md w-full"></div>
                <div className="h-10 bg-gray-200 rounded-md w-full"></div>
              </div>
            </div>

            {/* Skeleton for User Info */}
            <div className="rounded-xl shadow-md bg-white mb-6 w-full animate-pulse">
              <div className="p-6 border-b border-zinc-200 shadow-lg bg-white rounded-t-xl">
                <div className="h-8 bg-gray-200 rounded-md w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
              </div>
              <div className="p-6 space-y-4 bg-white rounded-b-xl">
                <div className="h-20 bg-gray-200 rounded-md w-full"></div>
                <div className="h-20 bg-gray-200 rounded-md w-full"></div>
                <div className="h-20 bg-gray-200 rounded-md w-full"></div>
                <div className="h-12 bg-gray-200 rounded-md w-full"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className=" mt-4 flex xl:flex-row flex-col items-center justify-center gap-2">
            {/* Property card */}
            <div className="xl:w-xl w-full ">
              <Properties prop={props} />
            </div>
            <div className="xl:w-xl  w-full max-h-2xl  ">
              <div className="max-h-sm rounded-xl shadow-md mb-6 bg-white">
                <div className="p-6 border-b border-zinc-200 bg-white rounded-t-xl">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    Booking Details
                  </h2>
                </div>

                <div className="p-6 space-y-6 bg-white rounded-b-xl ">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        onChange={(e) => {
                          setErrors((prev) => ({
                            ...prev,
                            date: "",
                          }));
                          setDate(e.target.value);
                        }}
                        className={`w-full p-3 border ${
                          errors.date ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 ease-in-out`}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                      {errors.date && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.date}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className=" text-sm font-medium text-gray-700 mb-2 flex gap-1">
                      Price{" "}
                      {isBar ? (
                        <p className="text-green-500">(Bargained)</p>
                      ) : (
                        <p className="text-zinc-500 font-mono">
                          (you can bargain the price)
                        </p>
                      )}
                    </label>
                    {/* {console.log(props)} */}
                    <input
                      type="text"
                      value={
                        isBar
                          ? new Intl.NumberFormat("en-IN").format(barPrice)
                          : new Intl.NumberFormat("en-IN").format(props.price)
                      }
                      onChange={(e) => {
                        // console.log(e.target.value)
                        setErrors((prev) => ({
                          ...prev,
                          price: "",
                        }));
                        const rawValue = e.target.value.replace(/,/g, ""); // remove commas
                        if (!isNaN(rawValue)) {
                          setBarPrice(rawValue);
                        }
                      }}
                      className={`w-full p-3 border border-gray-300 rounded-md   text-gray-700 font-mono ${
                        errors.price ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    />
                    {errors.price && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.price}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className=" text-sm font-medium text-gray-700 mb-2 flex gap-1">
                      Contact{" "}
                    </label>
                    {/* {console.log(props)} */}
                    <div className="flex items-center justify-center font-mono">
                      <input
                        type="text"
                        value={
                          user?.phone
                            ? user.phone
                            : "" + " Click the edit button to add detail"
                        }
                        readOnly
                        className={`w-full p-3 border border-gray-300 rounded-md bg-gray-100 outline-none  text-gray-700 ${
                          errors.contact ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      <span
                        className="bg-black text-center ml-2 p-2 rounded-md"
                        onClick={() => {
                          setErrors((prev) => ({
                            ...prev,
                            contact: "",
                          }));
                          setEditOpen(true);
                        }}
                      >
                        <UserPen
                          size={25}
                          className="  text-white "
                        />
                      </span>
                    </div>
                    {errors.contact && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contact}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Info */}
            </div>
          </div>
        </>
      )}

      {/* Booking Button */}
      <form
        noValidate
        onSubmit={handleConfirmBooking}
      >
        <div
          className={`xl:w-[80%] xl:ml-[20%] ml-0  fixed bottom-0 left-0 w-full transition-all bg-white border-t border-zinc-200 p-2  ${
            show ? "translate-y-0" : "xl:translate-y-0 -translate-y-15"
          }`}
        >
          <button
            type="submit"
            // onClick={handleConfirmBooking}
            className={` cursor-pointer w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center transition duration-300 ease-in-out bg-black
            `}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-100" />
                Processing...
              </span>
            ) : (
              "Confirm Booking"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ViewProp;
