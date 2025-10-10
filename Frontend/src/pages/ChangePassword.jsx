import React, { useContext, useState } from "react";
import { AppContext } from "../contexts/AppContextx";
import { Loader2, Eye, EyeClosed, Lock } from "lucide-react";
import AlertBox from "../components/AlertBox";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const [errors, setErrors] = useState([]);
  const [backendError, setBackendError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const { user, setUser } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [fields] = useState([
    {
      name: "Current Password",
      type: "password",
      placeholder: "********",
      icon: <Lock size={20} />,
    },
    {
      name: "New Password",
      type: "password",
      placeholder: "********",
      icon: <Lock size={20} />,
    },
  ]);
  const [fieldData, setFieldData] = useState([]);

  const validate = () => {
    const newErrors = {};

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!validate()) {
        return;
      }

      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/auth/edit-profile`,
        {
          token: localStorage.getItem("token"),
          currentPassword: fieldData["Current Password"],
          newPassword: fieldData["New Password"],
        }
      );
      if (res.status === 200) {
        setLoading(false);
        setSuccess("Password changed Successfully.");
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setBackendError(err.response.data.message);
    }
  };
  if (user?.uuid)
    return (
      <div className="flex">
        <h2 className="text-3xl font-bold ">Your password cannot be changed</h2>
      </div>
    );
  return (
    <div className="w-full h-screen pt-10">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full">
        {/* Alert Messages */}
        {backendError && (
          <div className="px-4 pt-4">
            <AlertBox
              message={backendError}
              type="error"
              onClose={() => setBackendError(null)}
            />
          </div>
        )}
        {success && (
          <div className="px-4 pt-4">
            <AlertBox
              message={success}
              type="success"
              onClose={() => setSuccess(null)}
            />
          </div>
        )}
        {console.log(fieldData["Current Password"])}

        {/* Edit Form */}
        <div className="w-full py-6 border-b border-zinc-200">
          <h2 className="text-3xl font-bold ">Change your Password</h2>

          <form
            onSubmit={(e) => handleSubmit(e)}
            className="space-y-4"
          >
            {fields.map((field, i) => (
              <div
                className="relative "
                key={i}
              >
                <h4>{field.name}</h4>
                <span className="absolute z-10 left-4 top-1/2 -translate-y-1/2 mt-2  text-gray-400 pointer-events-none">
                  {field.icon}
                </span>

                <input
                  id={field.name}
                  name={field.name}
                  type={showPass ? "text" : "password"}
                  value={
                    fieldData[field?.name]?.length > 0
                      ? fieldData[field.name]
                      : ""
                  }
                  autoComplete={field.type}
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      setFieldData((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        [field.name]: "",
                      }));
                    } else {
                      setFieldData((prev) => ({
                        ...prev,
                        [field.name]: "",
                      }));
                    }
                  }}
                  className={`w-full py-3 pl-12 pr-4 rounded-xl border ${
                    errors[field.name] ? "border-red-500" : "border-gray-200"
                  } bg-white/80 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-zinc-200 focus:outline-none transition-all`}
                  placeholder={field.placeholder}
                />

                {showPass ? (
                  <Eye
                    onClick={() => setShowPass(false)}
                    className="absolute z-20 right-4 top-1/2 -translate-y-1/2 mt-2 text-gray-400 "
                    size={20}
                  />
                ) : (
                  <EyeClosed
                    onClick={() => setShowPass(true)}
                    className="absolute z-20  top-1/2 right-4 -translate-y-1/2 mt-2 text-gray-400 "
                    size={20}
                  />
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Action Buttons */}
        <div className=" py-4 bg-white border-t border-zinc-200 sticky bottom-0 md:static">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              onClick={handleSubmit}
              className={`w-full  cursor-pointer h-10 px-4 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 ${
                loading
                  ? "bg-zinc-400 cursor-not-allowed"
                  : "bg-black hover:bg-zinc-800 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
