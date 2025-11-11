import { useContext, useEffect, useState } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import ExtendedProperty from "../components/ExtendedProperty";
import { Loader2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const BookedProp = () => {
  const { user, setUser } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [cancLoading, setCancLoading] = useState(false);
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
    document.body.style.overflow = cancelOpen ? "hidden" : "auto";
  }, [cancelOpen]);

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
      setCancLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/booking/cancel-booking`,
        {
          _id: params?.id,
          token: localStorage.getItem("token"),
        }
      );
      if (res.status === 200) {
        setCancelOpen(false);
        setCancLoading(false);
        setSuccess("Your booking has been canceled.");
        setPropData({});
      }
    } catch (err) {
      setCancelOpen(false);
      setCancLoading(false);
      setBackendError("Unable to cancel booking.");
    }
  };
  const activeBooking = user?.bookedProperties?.find(
    (myProps) => myProps.propId === params.id
  );

  return (
    <div className="w-full min-h-screen overflow-hidden  pt-20 pb-18">
      {/* Edit Profile Modal */}

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
      {cancelOpen && (
        <div className="w-full h-screen absolute inset-0 p-4 flex items-center justify-center bg-black/40 backdrop-blur-md z-[999]">
          {cancLoading ? (
            <div className="flex items-center justify-center bg-white/95 dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 text-center max-w-sm w-full transition-all duration-300">
              <Loader2 className="animate-spin w-5 h-5" />
            </div>
          ) : (
            <div className="bg-white/95 dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 text-center max-w-sm w-full transition-all duration-300">
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Cancel Booking?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to cancel this booking? This action cannot
                be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => HandleCancel()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium shadow-sm hover:shadow-md hover:from-red-600 hover:to-rose-700 active:scale-[0.98] transition-all"
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setCancelOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 active:scale-[0.98] transition-all"
                >
                  No, Keep It
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center justify-between py-5">
        <span></span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              variant="ghost"
              size="icon"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => setCancelOpen(true)}
            >
              Cancel Booking
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ExtendedProperty
        props={props}
        price={activeBooking.price || null}
      />
      <hr />
      <div className="mt-2"></div>

      {activeBooking.note ? (
        <div className="flex flex-col">Note:{activeBooking.note}</div>
      ) : null}
      <div className="">
        {activeBooking.status ? (
          <button className="bg-green-500 text-white rounded-full p-3">
            Pay via Esewa
          </button>
        ) : (
          <>PROCESSING...</>
        )}
      </div>
    </div>
  );
};

export default BookedProp;
