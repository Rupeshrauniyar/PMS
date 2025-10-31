import { useContext, useEffect, useState } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";
import { Delete, Trash, Trash2, X } from "lucide-react";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import EditProfile from "./EditProfile";
import ExtendedProperty from "../components/ExtendedProperty";

const BookedProp = () => {
  const { user, setUser } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [propertyLoading, setPropertyLoading] = useState(true);

  if (
    !user?.bookedProperties?.find((myProps) => myProps?.propId === params.id)
  ) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            Oops! Link Not Found
          </h1>
          <p className="text-gray-600 mb-6 max-w-md">
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>
          <Link
            to={`/view/${params.id}`}
            className="inline-block bg-black hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Go to Correct Page
          </Link>
        </div>
      </>
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
        } else {
          setPropData({});
        }
      } catch (err) {
        // console.log(err);
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
  // console.log(props);
  if (!props._id) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <h3 className="text-center font-bold text-xl">No property found</h3>
        {success && (
          <AlertBox
            message={success}
            type="success"
            onClose={() => {
              setUser((prev) => ({
                ...prev,
                bookedProperties: prev.bookedProperties.filter(
                  (item) => item.propId !== params.id
                ),
              }));
              navigate("/profile");
            }}
          />
        )}
      </div>
    );
  }
  const HandleCancel = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/booking/cancel-booking`,
        {
          _id: params?.id,
          token: localStorage.getItem("token"),
        }
      );
      if (res.status === 200) {
        setSuccess("Your booking has been canceled.");
        setPropData({});
      }
    } catch (err) {
      setBackendError("Unable to cancel booking.");
    }
  };
  const activeBooking = user?.bookedProperties?.find(
    (myProps) => myProps.propId === params.id
  );
  
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
          onClose={() => {
            setSuccess(null);
            navigate("/profile");
          }}
        />
      )}
      {backendError && (
        <AlertBox
          message={backendError}
          type="error"
          onClose={() => setBackendError(null)}
        />
      )}
      <ExtendedProperty
        props={props}
        price={activeBooking.price || null}
      />
      <hr />
      <div className="mt-2"></div>
      <button
        onClick={() => HandleCancel()}
        className="bg-red-500/90 text-black px-4  py-3 rounded-md "
      >
        Cancel Booking
      </button>
      <div className="flex flex-col">Note:{activeBooking.note}</div>
      <div className="">
        {activeBooking.status ? (
          <button className="bg-green-500 text-white rounded-full p-3">Pay via Esewa</button>
        ) : (
          <>Wait until Owner accepts your Booking.</>
        )}
      </div>
    </div>
  );
};

export default BookedProp;
