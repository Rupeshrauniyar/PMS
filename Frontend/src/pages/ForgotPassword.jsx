import React, { useContext, useEffect, useState } from "react";
import { Loader2, Eye, EyeClosed, Lock } from "lucide-react";
import AlertBox from "../components/AlertBox";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";

const ForgotPassword = () => {
  const [errors, setErrors] = useState([]);
  const [backendError, setBackendError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const fields = [
    {
      name: "New Password",
      type: "password",
      err: "new",
      placeholder: "********",
      icon: <Lock size={20} />,
    },
    {
      name: "Confirm Password",
      type: "password",
      err: "con",
      placeholder: "********",
      icon: <Lock size={20} />,
    },
  ];
  const [pageLoad, setPageLoad] = useState(true);
  const [verify, setVerify] = useState(false);

  const [fieldData, setFieldData] = useState([]);
  const navigate = useNavigate();
  const params = useParams();

  const validate = () => {
    const newErrors = {};
    if (!fieldData["New Password"]) {
      newErrors.new = "New password is required";
    } else if (!fieldData["Confirm Password"]) {
      newErrors.con = "Confirm password is required";
    } else if (fieldData["New Password"] !== fieldData["Confirm Password"]) {
      // newErrors.new = "Passwords donot match";
      newErrors.con = "Passwords donot match";
    }
    if (
      !fieldData["New Password"].length > 7 ||
      !fieldData["Confirm Password"].length > 7
    ) {
      newErrors.new = "Passwords must be greater than 7 digits";
      newErrors.con = "Passwords must be greater than 7 digits";
    }
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
        `${import.meta.env.VITE_backendUrl}/api/cred/forgot-password`,
        {
          token: params.token,
          newPassword: fieldData["New Password"],
        }
      );
      if (res.status === 200) {
        setLoading(false);
        setSuccess(
          "Password reset Successfully, Now you can Signin with new Credentials"
        );
        // navigate("/signin");
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setBackendError(err.response.data.message || "Something went wrong");
    }
  };

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_backendUrl}/api/cred/verify-token`,
          {
            token: params?.token,
          }
        );
        // console.log(res.data.success === true);
        if (res.data.success) {
          setPageLoad(false);
          setVerify(true);
          return
        }
        setPageLoad(false);
        setVerify(false);
      } catch (err) {
        setPageLoad(false);
        setVerify(false);
      }
    };
    verify();
  }, [params]);

  if (pageLoad)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!verify)
    return (
      <div className="max-w-2xl mx-auto h-screen flex items-center justify-center">
        <span className="w-full flex flex-col items-center justify-center gap-1">
          <h3 className="text-xl font-semibold">
            Your Token has been Expired.
          </h3>
          <Link
            to="/pass-reset-mail"
            className="w-full border  text-white border-zinc-200 rounded-xl px-6 py-3 bg-black hover:bg-zinc-800 active:scale-[0.98] transition-colors flex items-center justify-center gap-3"
          >
            Resend Email
          </Link>
        </span>
      </div>
    );
  return (
    <div className="w-full h-screen pt-10">
      {/* Main Content */}
      {/* {console.log(params)} */}
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full">
        {/* Alert Messages */}
        {backendError && (
          <div className="px-4 pt-4">
            <AlertBox
              message={backendError}
              type="error"
              onClose={() => {
                setBackendError(null);
                navigate("/pass-reset-mail");
              }}
            />
          </div>
        )}
        {success && (
          <div className="px-4 pt-4">
            <AlertBox
              message={success}
              type="success"
              onClose={() => {
                setSuccess(null);
                navigate("/signin");
              }}
            />
          </div>
        )}
        

        {/* Edit Form */}
        <div className="w-full py-6 border-b border-zinc-200">
          {/* <h2 className="text-3xl font-bold ">Change your Password</h2> */}

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
                    errors[field.err] ? "border-red-500" : "border-gray-200"
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
                {errors[field.err] && (
                  <p className="text-red-500 text-xs ml-1 font-medium ">
                    {errors[field.err]}
                  </p>
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Action Buttons */}
        <div className="w-full py-4 bg-white border-t border-zinc-200 sticky bottom-0 md:static">
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
  );
};

export default ForgotPassword;
