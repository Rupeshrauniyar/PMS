import { useContext, useEffect, useState } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";
import { Delete, DeleteIcon, Trash, Trash2, X } from "lucide-react";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import EditProfile from "./EditProfile";
import Properties from "../components/Properties";
import { Loader2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const MyProp = () => {
  const { user } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!user?.myProperties?.find((myProps) => myProps?.propId === params.id)) {
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
          to={`/view/${params.id}`}
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
          `${import.meta.env.VITE_backendUrl}/api/fetching/get-my-prop`,
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
    document.body.style.overflow = deleteOpen ? "hidden" : "auto";
  }, [deleteOpen]);

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
        <h3 className="text-center font-bold text-xl">No properties found</h3>
      </div>
    );
  }
  const HandleDelete = async () => {
    try {
      setDeleteLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/property/delete-property`,
        {
          _id: params?.id,
          propertyType: props.propertyType,
          token: localStorage.getItem("token"),
        }
      );
      if (res.status === 200) {
        setDeleteLoading(false);
        setDeleteOpen(false);
        setSuccess("Your property has been Deleted successfully.");
        setPropData({});
      }
    } catch (err) {
      setDeleteLoading(false);
      setDeleteOpen(false);
      setBackendError("Unable to delete property.");
    }
  };
  const handleConfirm = async (userId) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/booking/confirm-booking`,
        {
          _id: params?.id,
          userId,
          token: localStorage.getItem("token"),
        }
      );
      if (res.status === 200) {
        setPropData((prop) => ({
          ...prop,
          bookers: prop.bookers.map((b) =>
            b.userId === userId ? { ...b, status: true } : b
          ),
        }));
        setSuccess("Your property booker has been confirmed successfully.");
      }
    } catch (err) {
      setBackendError("Unable to confirm booker.");
    }
  };
  const activeBooker = props.bookers.find((booker) => booker.status);

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
      {deleteOpen && (
        <div className="w-full h-screen absolute inset-0 p-4 flex items-center justify-center bg-black/40 backdrop-blur-md z-[999]">
          {deleteLoading ? (
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
                  onClick={() => HandleDelete()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium shadow-sm hover:shadow-md hover:from-red-600 hover:to-rose-700 active:scale-[0.98] transition-all"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteOpen(false)}
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
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* <span className="flex items-center justify-between py-3">
        <p></p>
        <button
          className="bg-red-600/90 p-2 rounded-md text-white"
          onClick={() => HandleDelete()}
        >
          <Trash2 />
        </button>
      </span> */}
      <Properties prop={props} />
      {props.bookers.length > 0 ? (
        <>
          {/* 🟢 Active Booker */}
          {activeBooker && (
            <>
              <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
                Active Booking
              </h3>

              <div className="flex flex-col gap-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-lg p-5 mb-8 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900 dark:text-gray-50">
                    {activeBooker.userId.username}
                  </span>
                  <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹
                    {activeBooker.price
                      ? new Intl.NumberFormat("en-IN").format(
                          activeBooker.price
                        )
                      : "N/A"}
                  </span>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Note:
                    </span>{" "}
                    {activeBooker.note || "No additional note provided."}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Type:
                    </span>{" "}
                    {activeBooker.bType || "Not specified"}
                  </p>
                </div>

                <div className="flex justify-end mt-3">
                  <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all">
                    Confirmed
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 🟣 Other Bookers */}
          <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Other Bookers
          </h3>

          {props.bookers.filter((item) => !item.status).length > 0 ? (
            <div className="flex flex-col gap-4">
              {props.bookers
                .filter((item) => !item.status)
                .map((booker, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-lg p-5 transition-all hover:shadow-xl hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900 dark:text-gray-50">
                        {booker.userId.username}
                      </span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        ₹
                        {booker.price
                          ? new Intl.NumberFormat("en-IN").format(booker.price)
                          : "N/A"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Note:
                        </span>{" "}
                        {booker.note || "No additional note provided."}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Type:
                        </span>{" "}
                        {booker.bType || "Not specified"}
                      </p>
                    </div>

                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handleConfirm(booker.userId._id)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-sm hover:shadow-md hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] transition-all"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-inner p-10 mt-4">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                No pending booking requests at the moment.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                All bookings have been confirmed or there are no new requests
                yet.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-inner p-10">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            No bookings available.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Once a customer books your property, details will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyProp;
