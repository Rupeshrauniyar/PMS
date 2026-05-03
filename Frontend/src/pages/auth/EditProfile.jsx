import React, { useContext, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import { Loader2, Mail, Phone, User, ChevronDown, CheckCircle2, Lock } from "lucide-react";
import AlertBox from "../../components/AlertBox";
import api from "../../api/client";

const countryCodes = [
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
];

const EditProfile = (props) => {
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { user, setUser } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getInitialCountryCode = () => {
    if (!user?.phone) return "+977";
    const match = countryCodes.find((c) => user.phone.startsWith(c.code));
    return match ? match.code : "+977";
  };

  const getPhoneNumber = () => {
    if (!user?.phone) return "";
    const countryCode = getInitialCountryCode();
    return user.phone.replace(countryCode, "").trim();
  };

  const [selectedCountry, setSelectedCountry] = useState(getInitialCountryCode());
  const [phoneNumber, setPhoneNumber] = useState(getPhoneNumber());

  const [fields] = useState([
    {
      name: "email",
      type: "text",
      placeholder: "you@example.com",
      icon: Mail,
      value: user?.email,
      label: "Email Address",
      disabled: true,
    },
    {
      name: "username",
      type: "text",
      placeholder: "John Doe",
      icon: User,
      value: user?.username,
      label: "Full Name",
    },
  ]);

  const [fieldData, setFieldData] = useState({
    email: user?.email,
    username: user?.username,
    phone: user?.phone,
  });

  const validate = () => {
    const newErrors = {};
    if (!fieldData.email?.trim() || !/^[\w.-]+@[\w.-]+\.[A-Z]{2,4}$/i.test(fieldData.email.trim())) {
      newErrors.email = "Invalid email address";
    }
    if (!fieldData.username?.trim()) {
      newErrors.username = "Name is required";
    }
    if (!fieldData.phone || fieldData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Invalid contact number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    try {
      e?.preventDefault();
      if (!validate()) return;
      setLoading(true);
      const res = await api.post("/api/auth/edit-profile", {
        _id: user?._id,
        username: fieldData.username,
        phone: fieldData.phone,
      });
      if (res.status === 200) {
        setUser(res.data.user);
        setLoading(false);
        setSuccess("Profile updated successfully.");
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setBackendError(err.response?.data?.message || "Something went wrong.");
    }
  };

  const handleCountryChange = (code) => {
    setSelectedCountry(code);
    setIsDropdownOpen(false);
    const fullNumber = phoneNumber ? `${code} ${phoneNumber}` : code;
    setFieldData((prev) => ({ ...prev, phone: fullNumber }));
  };

  const handlePhoneNumberChange = (e) => {
    const number = e.target.value.replace(/[^\d]/g, "");
    setPhoneNumber(number);
    const fullNumber = number ? `${selectedCountry} ${number}` : selectedCountry;
    setFieldData((prev) => ({ ...prev, phone: fullNumber }));
    setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const hasChanges =
    user?.username !== fieldData?.username ||
    user?.phone !== fieldData?.phone;

  const selectedCountryData = countryCodes.find((c) => c.code === selectedCountry);

  /* ─── Avatar initials ─── */
  const initials = user?.username
    ? user.username.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  /* ─── Compact embedded mode (props.css = true) ─── */
  if (props.css) {
    return (
      <div className="w-full">
        {backendError && (
          <AlertBox message={backendError} type="error" onClose={() => setBackendError(null)} />
        )}
        {success && (
          <AlertBox message={success} type="success" onClose={() => setSuccess(null)} />
        )}

        {/* User identity row */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
          <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">{user?.username || "—"}</p>
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
          {user?.phone && (
            <span className="ml-auto shrink-0 flex items-center gap-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* Username */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500">Full Name</label>
              {errors.username && <span className="text-[11px] text-red-500">{errors.username}</span>}
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={fieldData.username || ""}
                onChange={(e) => {
                  setFieldData((prev) => ({ ...prev, username: e.target.value }));
                  setErrors((prev) => ({ ...prev, username: "" }));
                }}
                placeholder="John Doe"
                className={`w-full py-2 pl-9 pr-3 rounded-lg border text-sm bg-white outline-none focus:ring-2 focus:ring-black focus:border-black transition-all ${
                  errors.username ? "border-red-400" : "border-zinc-200"
                }`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500">Phone Number</label>
              {errors.phone && <span className="text-[11px] text-red-500">{errors.phone}</span>}
              {props.error && !errors.phone && <span className="text-[11px] text-red-500">{props.error}</span>}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`h-9 px-2.5 flex items-center gap-1.5 border rounded-lg text-sm transition-all bg-white hover:bg-zinc-50 ${
                    errors.phone || props.error ? "border-red-400" : "border-zinc-200"
                  }`}
                >
                  <span>{selectedCountryData?.flag}</span>
                  <span className="text-zinc-700 font-medium text-xs">{selectedCountry}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleCountryChange(country.code)}
                          className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-50 transition-colors"
                        >
                          <span>{country.flag}</span>
                          <span className="text-sm text-zinc-800 flex-1 text-left">{country.country}</span>
                          <span className="text-xs text-zinc-400">{country.code}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="9812345678"
                className={`flex-1 h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-black focus:border-black transition-all bg-white ${
                  errors.phone || props.error ? "border-red-400" : "border-zinc-200"
                }`}
              />
            </div>
          </div>

          {/* Save */}
          <button
            disabled={loading || !hasChanges}
            onClick={handleSubmit}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              loading || !hasChanges
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Full-page mode ─── */
  return (
    <div className="w-full min-h-screen bg-zinc-50 pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Alerts */}
        {backendError && <AlertBox message={backendError} type="error" onClose={() => setBackendError(null)} />}
        {success && <AlertBox message={success} type="success" onClose={() => setSuccess(null)} />}

        {/* ── Profile hero card ── */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Top color band */}
          <div className="h-16 bg-zinc-900 relative">
            <div className="absolute -bottom-7 left-5">
              <div className="w-14 h-14 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-zinc-900 text-xl font-bold">
                {initials}
              </div>
            </div>
          </div>
          <div className="pt-10 px-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{user?.username || "—"}</h2>
                <p className="text-sm text-zinc-500">{user?.email}</p>
              </div>
              {user?.phone ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                  <Phone className="w-3.5 h-3.5" /> Add Phone
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Edit form card ── */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800 tracking-wide uppercase">Account Information</h3>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Email — locked */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Email Address</label>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Lock className="w-2.5 h-2.5" /> Cannot change
                </span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none" />
                <input
                  disabled
                  value={fieldData.email || ""}
                  className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-zinc-100 bg-zinc-50 text-sm text-zinc-400 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Full Name</label>
                {errors.username && <span className="text-xs text-red-500">{errors.username}</span>}
              </div>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={fieldData.username || ""}
                  onChange={(e) => {
                    setFieldData((prev) => ({ ...prev, username: e.target.value }));
                    setErrors((prev) => ({ ...prev, username: "" }));
                  }}
                  placeholder="John Doe"
                  className={`w-full py-2.5 pl-10 pr-4 rounded-xl border text-sm bg-white outline-none focus:ring-2 focus:ring-black focus:border-black transition-all ${
                    errors.username ? "border-red-400" : "border-zinc-200"
                  }`}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Phone Number</label>
                {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`h-10 px-3 flex items-center gap-2 border rounded-xl text-sm bg-white hover:bg-zinc-50 transition-all ${
                      errors.phone ? "border-red-400" : "border-zinc-200"
                    }`}
                  >
                    <span className="text-base">{selectedCountryData?.flag}</span>
                    <span className="text-zinc-700 font-medium text-sm">{selectedCountry}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-zinc-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountryChange(country.code)}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors ${
                              selectedCountry === country.code ? "bg-zinc-50" : ""
                            }`}
                          >
                            <span className="text-xl">{country.flag}</span>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-zinc-900">{country.country}</p>
                              <p className="text-xs text-zinc-400">{country.code}</p>
                            </div>
                            {selectedCountry === country.code && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="9812345678"
                    className={`w-full h-10 pl-10 pr-4 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-black transition-all bg-white ${
                      errors.phone ? "border-red-400" : "border-zinc-200"
                    }`}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-1.5 ml-0.5">Used for booking confirmations and contact.</p>
            </div>
          </div>
        </div>

        {/* ── Change indicator + save ── */}
        {hasChanges && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <p className="text-xs text-amber-700 font-medium flex-1">You have unsaved changes.</p>
          </div>
        )}

        <button
          disabled={loading || !hasChanges}
          onClick={handleSubmit}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm ${
            loading || !hasChanges
              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-zinc-800"
          }`}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> Save Changes</>
          )}
        </button>

      </div>
    </div>
  );
};

export default EditProfile;