import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import {
  CheckCircle,
  X,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ArrowUpRight,
} from "lucide-react";
import axios from "axios";
import AlertBox from "../../components/AlertBox";
import EditProfile from "../auth/EditProfile";
import Reccomended from "../../components/Recomended";
import ExtendedProperty from "../../components/ExtendedProperty";

const View = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  if (user?.myProperties?.find((my) => my?.propId === params.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center bg-white">
        <div className="max-w-md w-full">
          <div className="w-16 h-px bg-black mx-auto mb-8" />
          <h1 className="text-4xl font-light tracking-tight text-black mb-3">
            Wrong Page
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-8 font-light">
            This listing belongs to your portfolio. View it through your
            property dashboard.
          </p>
          <Link
            to={`/my/${params.id}`}
            className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            Open My Property <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  } else if (
    user?.bookedProperties?.find((book) => book?.propId === params.id)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center bg-white">
        <div className="max-w-md w-full">
          <div className="w-16 h-px bg-black mx-auto mb-8" />
          <h1 className="text-4xl font-light tracking-tight text-black mb-3">
            Already Booked
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-8 font-light">
            You have an existing booking for this property. Manage it from your
            bookings page.
          </p>
          <Link
            to={`/booked/${params.id}`}
            className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            View Booking <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const getProperty = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_backendUrl}/api/fetching/get-property`,
          { _id: params.id },
        );
        if (response?.status === 200 && response.data.Property?._id) {
          setPropData(response.data.Property);
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
      <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-hidden pb-20 pt-28 bg-white">
        <div className="xl:max-w-2xl w-full px-4 animate-pulse space-y-5">
          {/* Image skeleton */}
          <div className="bg-zinc-100 h-80 rounded-2xl w-full" />
          {/* Title skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-7 bg-zinc-100 rounded-full w-2/3" />
            <div className="h-4 bg-zinc-100 rounded-full w-1/3" />
          </div>
          {/* Divider */}
          <div className="h-px bg-zinc-100 w-full" />
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-100 h-20 rounded-xl" />
            ))}
          </div>
          {/* Description skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-zinc-100 rounded-full w-full" />
            <div className="h-3 bg-zinc-100 rounded-full w-5/6" />
            <div className="h-3 bg-zinc-100 rounded-full w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  const action = !user?.saved?.some((save) => save.propId === params?.id);

  const handleSave = async () => {
    try {
      if (!user?._id) {
        setBackendError("Sign in to save this property.");
      } else {
        const res = await axios.post(
          `${import.meta.env.VITE_backendUrl}/api/booking/save-property`,
          {
            id: params.id,
            token: localStorage.getItem("token"),
            action,
          },
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
      }
    } catch (err) {
      console.log(err);
      setBackendError(err.response?.data?.message || "Error saving property");
    }
  };

  return (
    <div className="w-full min-h-screen bg-white overflow-hidden pt-20 pb-40">
      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <>
          <div className="fixed z-50 xl:w-[56%] xl:left-[22%] w-[94%] left-[3%] top-4 h-[90vh] flex flex-col">
            <div className="w-full h-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-zinc-200 animate-[slideUp_0.25s_ease-out]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <span className="text-base font-semibold tracking-tight text-black">
                  Edit Profile
                </span>
                <button
                  onClick={() => setEditOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X size={18} className="text-zinc-600" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 pb-6">
                <EditProfile />
              </div>
            </div>
          </div>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-[fadeIn_0.2s_ease-out]" />
        </>
      )}

      {/* ── Alerts ── */}
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

      {/* ── Top Navigation Bar ── */}
      <div className="w-full max-w-2xl mx-auto px-4 mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-black transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
            !action
              ? "bg-black text-white border-black"
              : "bg-white text-black border-zinc-300 hover:border-black"
          }`}
          title={action ? "Save property" : "Unsave property"}
        >
          {!action ? (
            <>
              <BookmarkCheck className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              Save
            </>
          )}
        </button>
      </div>

      {/* ── Property Content ── */}
      <div className="w-full max-w-2xl mx-auto ">
        <ExtendedProperty props={props} />
      </div>

      {/* ── Related Properties ── */}
      <div className="w-full max-w-2xl mx-auto mt-12">
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-xl font-semibold tracking-tight text-black">
            Related Properties
          </h3>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>
        <Reccomended id={props._id} />
        <p className="text-center text-xs text-zinc-400 mt-8 tracking-widest uppercase">
          End of recommendations
        </p>
      </div>

      {/* ── Sticky Booking Bar ── */}
      <div className="fixed xl:bottom-0 bottom-13  xl:w-[70%] xl:right-0 p-2 right-0  w-full z-[998] bg-white/80 backdrop-blur-xl border-t border-zinc-200">
        {/* <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          Price display
          {props.price && (
            <div className="hidden sm:flex flex-col">
              <span className="text-xs text-zinc-400 leading-none mb-0.5">
                per night
              </span>
              <span className="text-lg font-semibold text-black tracking-tight">
                ${props.price}
              </span>
            </div>
          )}

          
        </div> */}
        <Link to={`/book/${params.id}/${props.price}`} >
          <button className="w-full py-3.5 cursor-pointer rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 active:scale-[0.98] transition-all">
            <CheckCircle className="w-4 h-4" />
            Book This Property
          </button>
        </Link>
      </div>
    </div>
  );
};

export default View;
