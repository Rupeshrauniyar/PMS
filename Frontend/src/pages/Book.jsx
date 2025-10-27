import { useContext, useEffect, useState } from "react";
import {
  useNavigate,
  Link,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";
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
  Save,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  ImageIcon,
} from "lucide-react";
import Properties from "../components/Properties";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import EditProfile from "./EditProfile";
import SwiperComp from "../components/Swiper";

const Book = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);
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
  const [image, setImage] = useState("");
  const location = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const nextImage = () => {
    setImageLoading(true);
    setCurrentImageIndex((prev) => (prev + 1) % props.images?.length);
  };

  const prevImage = () => {
    setImageLoading(true);
    setCurrentImageIndex(
      (prev) => (prev - 1 + props.images?.length) % props.images?.length
    );
  };

  useEffect(() => {
    const getProperty = async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/get-property`,
        {
          _id: params.id,
        }
      );
      if (response?.status === 200 && response.data.Property._id) {
        setPropData(response.data.Property);
        setBarPrice(response.data.Property.price);
        setImage(response.data.Property.images[0]);
        setCurrentImageIndex(0);
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
      setSubmitting(false);
      setBackendError(err.response.data.message);
    }
  };

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

  if (propertyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-hidden pb-20 pt-26">
        <div className="xl:w-2xl w-full animate-pulse space-y-4">
          <div className="bg-gray-200 h-96 rounded-2xl mb-4"></div>
          <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded-md w-1/2 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!props._id)
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <h3 className="text-center font-bold text-xl">
          No properties available
        </h3>
      </div>
    );

  const action = !user?.saved?.some((save) => save.propId === params?.id);

  return (
    <div className="w-full min-h-screen overflow-hidden mt-16 ">
      {/* Edit Profile Modal */}
      {editOpen && (
        <>
          <div className="xl:w-[60%] xl:ml-[30%] ml-0 w-[96%] h-[650px] top-0 left-2 flex flex-col fixed z-30 items-center justify-center overflow-hidden xl:mt-15">
            <div className="w-full h-[80%] bg-white px-2 rounded-3xl overflow-y-auto mt-12 flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]">
              <div className="flex items-center justify-between mt-6 px-4">
                <span className="text-xl font-semibold">Edit Profile</span>
                <button
                  onClick={() => setEditOpen(false)}
                  className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                >
                  <X size={26} />
                </button>
              </div>
              <div>
                <EditProfile />
              </div>
              <div className="pb-20"></div>
            </div>
          </div>
          <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm z-20 animate-[fadeIn_0.3s_ease-out]"></div>
        </>
      )}

      {/* Header Navigation */}
      <div className="max-w-7xl mx-auto   py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-black font-medium transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <button
            className="p-2 rounded-full hover:bg-gray-200 transition-all hover:scale-110"
            onClick={async () => {
              try {
                const res = await axios.post(
                  `${import.meta.env.VITE_backendUrl}/api/save-property`,
                  {
                    id: params.id,
                    token: localStorage.getItem("token"),
                    action,
                  }
                );
                if (res.status === 200) {
                  setSuccess(res.data.message);
                  if (action) {
                    setUser((prev) => ({
                      ...prev,
                      saved: [
                        ...prev.saved,
                        { propId: params.id, createdAt: Date.now() },
                      ],
                    }));
                  } else {
                    setUser((prev) => ({
                      ...prev,
                      saved: prev.saved.filter(
                        (saveId) => saveId === params.id
                      ),
                    }));
                  }
                }
              } catch (err) {
                setBackendError(err.response.data.message);
              }
            }}
          >
            {!action ? (
              <BookmarkCheck className="text-blue-600" />
            ) : (
              <Bookmark className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

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
      <div className="max-w-7xl mx-auto ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 ">
            {/* Image Gallery Section */}
            <div className="bg-white  shadow-lg overflow-hidden animate-[fadeIn_0.5s_ease-out]">
              <div className="relative group">
                {/* Main Image Display */}
                <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  )}
                  <img
                    src={props.images?.[currentImageIndex] || props.images?.[0]}
                    alt={props.title}
                    className={`w-full h-full xl:object-contain   object-cover transition-opacity duration-300 ${
                      imageLoading ? "opacity-0" : "opacity-100"
                    }`}
                    onLoad={() => setImageLoading(false)}
                    loading="lazy"
                  />

                  {/* Image Counter Badge */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-[slideDown_0.3s_ease-out]">
                    <ImageIcon className="w-4 h-4" />
                    {currentImageIndex + 1} / {props.images?.length || 0}
                  </div>

                  {/* Navigation Arrows */}
                  {props.images?.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-800" />
                      </button>
                    </>
                  )}

                  {/* Gradient Overlay at Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Thumbnail Gallery */}
                <div className="py-2  bg-white border-t border-gray-100">
                  <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
                    {props.images?.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setImageLoading(true);
                          setCurrentImageIndex(index);
                        }}
                        className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all transform hover:scale-105 ${
                          currentImageIndex === index
                            ? "border-black ring-1 ring-blue-100 "
                            : "border-gray-200 "
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Title & Details */}
            <div className="bg-white animate-[slideUp_0.5s_ease-out]  space-y-4">
              {/* Title */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {props.title}
                </h1>

                {/* Location */}
                <div className="flex items-start text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mt-1 mr-1 flex-shrink-0 text-gray-500" />
                  <span className="text-sm">{props.location}</span>
                </div>

                {/* Key Features - Tag Style */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
                    <span className="font-semibold text-gray-900 mr-1">
                      ₹
                      {props.price
                        ? new Intl.NumberFormat("en-IN").format(props.price)
                        : "N/A"}
                    </span>
                  </div>

                  {props.area && props.area > 0 && (
                    <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
                      <Maximize className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                      <span className="text-gray-700">{props.area}</span>
                    </div>
                  )}

                  <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
                    <Bed className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                    <span className="text-gray-700">
                      {props.rooms} {props.rooms === 1 ? "Room" : "Rooms"}
                    </span>
                  </div>

                  <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
                    <Bath className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                    <span className="text-gray-700">
                      {props.washrooms}{" "}
                      {props.washrooms === 1 ? "Bathroom" : "Bathrooms"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <div className="relative">
                  <p
                    className={`text-gray-600 leading-relaxed text-sm whitespace-pre-line transition-all duration-300 ${
                      !showFullDescription && props.description.length > 50
                        ? "line-clamp-2"
                        : ""
                    }`}
                  >
                    {props.description}
                  </p>
                  {props.description.length > 50 && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
                    >
                      {showFullDescription ? "Show Less" : "Read More"}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          showFullDescription ? "-rotate-90" : "rotate-90"
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Key Features Grid */}
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            {user ? (
              user.myProperties?.some(
                (myProps) => myProps?.propId === params.id
              ) ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 animate-[slideUp_0.5s_ease-out]">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Home className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-xl font-semibold text-gray-700 mb-2">
                      Your Property
                    </p>
                    <p className="text-gray-500">
                      You cannot book your own property
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  id="book"
                  className=" rounded-2xl shadow-xl sticky top-24 animate-[slideUp_0.5s_ease-out] "
                >
                  <div className=" ">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                      Book Property
                    </h2>
                    <p className="text-gray-600  text-sm">
                      Schedule your visit
                    </p>
                  </div>

                  <div className="py-2 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                              : new Intl.NumberFormat("en-IN").format(
                                  props.price
                                )
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

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact Number
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={user?.phone || ""}
                          readOnly
                          placeholder="Add your contact"
                          className={`flex-1 p-3 border-2 ${
                            errors.contact
                              ? "border-red-500"
                              : "border-gray-200"
                          } rounded-xl bg-gray-50 text-gray-700 font-mono`}
                        />
                        <button
                          onClick={() => {
                            setErrors((prev) => ({ ...prev, contact: "" }));
                            setEditOpen(true);
                          }}
                          className="p-3 bg-black hover:bg-gray-800 text-white rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                          <UserPen size={20} />
                        </button>
                      </div>
                      {errors.contact && (
                        <p className="text-red-500 text-xs mt-2 flex items-center animate-bounce">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-1 "></span>
                          {errors.contact}
                        </p>
                      )}
                    </div>

                    <div
                      className="xl:w-[80%] xl:ml-[20%] ml-0  fixed xl:bottom-0 bottom-14 left-0 w-full transition-all bg-white border-t border-zinc-200 p-2"
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
                      {/* Booking Button */}
                      {user.bookedProperties.some(
                        (prop) => prop.propId === props._id
                      ) ? (
                        <button
                          disabled
                          className="w-full py-4 rounded-md  text-white font-semibold flex items-center justify-center bg-gray-800 cursor-not-allowed gap-2"
                        >
                          <CheckCircle size={20} />
                          Already Booked
                        </button>
                      ) : (
                        <form
                          noValidate
                          onSubmit={handleConfirmBooking}
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
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 animate-[slideUp_0.5s_ease-out]">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Sign in Required</h2>
                  <p className="text-gray-600 mb-6">
                    Create an account to book this property
                  </p>
                  <button
                    onClick={() => {
                      navigate("/signup", {
                        state: { from: location?.pathname },
                      });
                    }}
                    className="w-full bg-black hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Sign Up Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Book;
