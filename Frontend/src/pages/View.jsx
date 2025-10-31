import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";
import { CheckCircle, X, Bookmark, BookmarkCheck } from "lucide-react";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import EditProfile from "./EditProfile";
import Reccomended from "../components/Recomended";
import ExtendedProperty from "../components/ExtendedProperty";

const View = () => {
  const { user, setUser } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  if (user?.myProperties?.find((my) => my?.propId === params.id)) {
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
    user?.bookedProperties?.find((book) => book?.propId === params.id)
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
          `${import.meta.env.VITE_backendUrl}/api/fetching/get-property`,
          { _id: params.id }
        );
        if (response?.status === 200 && response.data.Property?._id) {
          setPropData(response.data.Property);
          // setCurrentImageIndex(0);
        } else {
          setPropData({});
        }
      } catch (err) {
        console.log(err);
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
  const action = !user?.saved?.some((save) => save.propId === params?.id);

  const handleSave = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/booking/save-property`,
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
      console.log(err);
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

      <ExtendedProperty props={props} />
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
      <div className="max-w-7xl mx-auto mt-4 border-t-2 border-zinc-200">
        <Reccomended id={params.id} />
      </div>
    </div>
  );
};

export default View;
