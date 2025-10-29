import { useContext, useEffect, useState } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";
import {
  CheckCircle,
  Loader2,
  Bookmark,
  X,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ImageIcon,
  Users,
} from "lucide-react";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import EditProfile from "./EditProfile";
import Reccomended from "../components/Recomended";

const View = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const location = useLocation();

  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
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
  useEffect(() => {
    const getProperty = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_backendUrl}/api/get-property`,
          { _id: params.id }
        );
        if (response?.status === 200 && response.data.Property?._id) {
          setPropData(response.data.Property);
          setCurrentImageIndex(0);
        } else {
          setPropData({});
        }
      } catch {
        setPropData({});
      } finally {
        setPropertyLoading(false);
      }
    };
    getProperty();
  }, [params.id]);

  useEffect(() => {
    document.body.style.overflow = editOpen ? "hidden" : "auto";
  }, [editOpen]);

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

  if (!props._id) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <h3 className="text-center font-bold text-xl">
          No properties available
        </h3>
      </div>
    );
  }

  const action = !user?.saved?.some((save) => save.propId === params?.id);

  const handleSave = async () => {
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

        setUser((prev) => ({
          ...prev,
          saved: action
            ? [...prev.saved, { propId: params.id, createdAt: Date.now() }]
            : prev.saved.filter((s) => s.propId !== params.id),
        }));
      }
    } catch (err) {
      setBackendError(err.response?.data?.message || "Error saving property");
    }
  };

  return (
    <div className="w-full min-h-screen overflow-hidden  pt-20 pb-18">
      {/* Edit Profile Modal */}
      {editOpen && (
        <>
          <div className="fixed z-50 xl:w-[60%] xl:ml-[20%] w-[96%] h-[650px] top-0 left-2 flex flex-col items-center justify-center overflow-hidden">
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
              <EditProfile />
            </div>
          </div>
          <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm z-40 animate-[fadeIn_0.3s_ease-out]"></div>
        </>
      )}

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

      {/* Property Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4">
        {/* Image Gallery */}
        <div className="overflow-hidden animate-[fadeIn_0.5s_ease-out]">
          <div className="relative group">
            <div className="relative w-full h-[300px] md:h-[350px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              <img
                src={props.images?.[currentImageIndex] || props.images?.[0]}
                alt={props.title}
                className={`relative w-full h-full object-cover xl:object-contain z-15 transition-opacity duration-300 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setImageLoading(false)}
                loading="lazy"
              />

              {/* Background Blur */}
              <div
                className="absolute inset-0 bg-no-repeat bg-center bg-cover filter blur-lg transform scale-110 z-10"
                style={{
                  backgroundImage: `url(${
                    props.images?.[currentImageIndex] || props.images?.[0]
                  })`,
                }}
              ></div>

              {/* Counter */}
              <div className="absolute z-30 top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {currentImageIndex + 1} / {props.images?.length || 0}
              </div>

              {/* Arrows */}
              {props.images?.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div className="py-2 border-t border-gray-100">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
                {props.images?.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setImageLoading(true);
                      setCurrentImageIndex(index);
                    }}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                      currentImageIndex === index
                        ? "border-black ring-1 ring-blue-100"
                        : "border-gray-200"
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

        {/* Property Info */}
        <div className=" animate-[slideUp_0.5s_ease-out]">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {props.title}
          </h1>

          <p
            className={`text-gray-600 text-sm leading-relaxed transition-all ${
              !showFullDescription && props.description.length > 80
                ? "line-clamp-2"
                : ""
            }`}
          >
            {props.description}
          </p>

          {props.description.length > 80 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              {showFullDescription ? "Show Less" : "Read More"}
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  showFullDescription ? "-rotate-90" : "rotate-90"
                }`}
              />
            </button>
          )}

          {/* Property Details */}
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {props.area > 0 ? (
              <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
                <Maximize className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                <span>{props.area}</span>
              </div>
            ) : null}
            <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
              <Bed className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
              <span>
                {props.rooms} {props.rooms === 1 ? "Room" : "Rooms"}
              </span>
            </div>
            <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm w-40 ">
              <MapPin className="w-4 h-4 mr-1 text-gray-500 " />
              <span className="truncate w-[85%]">{props.location}</span>
            </div>
            <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
              <Bath className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
              <span>
                {props.washrooms}{" "}
                {props.washrooms === 1 ? "Bathroom" : "Bathrooms"}
              </span>
            </div>
          </div>

          <span className="text-gray-900 text-2xl font-bold">
            ₹
            {props.price
              ? new Intl.NumberFormat("en-IN").format(props.price)
              : "N/A"}
          </span>
        </div>

        {/* Save & Book Buttons */}
        <div className="bookingButtons bg-white flex items-center justify-between gap-2 xl:px-30 px-2 xl:ml-[20%] xl:w-[80%] shadow-xl fixed xl:bottom-0 bottom-14 left-0 w-full border-t border-zinc-200 p-2">
          <button
            className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center bg-black hover:bg-gray-800 transition-all"
            onClick={handleSave}
          >
            {!action ? (
              <>
                <BookmarkCheck className="text-blue-600 w-5 h-5 mr-1" />
                Unsave
              </>
            ) : (
              <>
                <Bookmark className="text-blue-500 w-5 h-5 mr-1" />
                Save
              </>
            )}
          </button>

          <Link
            to={`/book/${params.id}/${props.price}`}
            className="w-full"
          >
            <button className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center bg-black hover:bg-gray-800 transition-all">
              <CheckCircle className="w-5 h-5 mr-2" />
              Book
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-4 border-t-2 border-zinc-200">
        <Reccomended id={params.id} />
      </div>
    </div>
  );
};

export default View;
