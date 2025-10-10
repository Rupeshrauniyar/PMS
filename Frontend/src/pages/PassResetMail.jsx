import axios from "axios";
import { Loader2, Mail } from "lucide-react";
import React, { useState } from "react";
import AlertBox from "../components/AlertBox";

const PassResetMail = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [backendError, setBackendError] = useState(null);
  const [success, setSuccess] = useState(null);

  const sendEmail = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/cred/send-pass-reset-mail`,
        { email }
      );
      if (res.status === 200) {
        setSuccess(res.data.message);
        setLoading(false);
      } else {
        setBackendError(res.data.message);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setBackendError(err.response.data.message);
    }
  };
  return (
    <div className="pt-16 max-w-2xl mx-auto min-h-screen flex flex-col items-center justify-center">
      {backendError && (
        <AlertBox
          message={backendError}
          type="error"
          onClose={() => setBackendError(null)}
        />
      )}
      {success && (
        <AlertBox
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}
      <h2 className="text-3xl font-bold">Reset your password</h2>
      <p>Enter your email to get Reset link inside your Gmail</p>
      <div className="w-full flex flex-col items-center justify-center gap-3">
        <div className="w-full relative mt-1">
          <span className="absolute z-10 left-4 top-1/2 -translate-y-1/2  text-gray-400 pointer-events-none">
            <Mail size={20} />
          </span>

          <input
            id={"email"}
            name={"email"}
            type="email"
            autoComplete={"email"}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full py-3 pl-12 pr-4 rounded-xl border ${
              errors["email"] ? "border-red-500" : "border-gray-200"
            } bg-white/80 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-zinc-200 focus:outline-none transition-all`}
            placeholder={"Enter your email"}
          />
        </div>
        <button
          disabled={loading ? true : false}
          onClick={() => sendEmail()}
          className={`w-full ${
            loading ? "bg-zinc-600" : "bg-zinc-900"
          } hover:bg-zinc-800 cursor-pointer text-white font-medium px-6 py-3 rounded-xl transition-colors flex items-center justify-center`}
        >
          {loading ? (
            <Loader2
              size={18}
              className="animate-spin ml-1"
            />
          ) : (
            <>Send Mail</>
          )}
        </button>
      </div>
    </div>
  );
};

export default PassResetMail;
