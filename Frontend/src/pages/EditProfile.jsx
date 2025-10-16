import React, { useContext, useState } from "react";
import { AppContext } from "../contexts/AppContextx";
import { Loader2, Mail, Phone, User, ChevronDown } from "lucide-react";
import AlertBox from "../components/AlertBox";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// Country codes data
const countryCodes = [
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
];

const EditProfile = () => {
  const [errors, setErrors] = useState([]);
  const [backendError, setBackendError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const { user, setUser } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extract country code and phone number
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

  const [selectedCountry, setSelectedCountry] = useState(
    getInitialCountryCode()
  );
  const [phoneNumber, setPhoneNumber] = useState(getPhoneNumber());

  const [fields, setFields] = useState([
    {
      name: "email",
      type: "text",
      placeholder: "you@example.com",
      icon: <Mail size={20} />,
      value: user?.email,
      label: "Email Address",
    },
    {
      name: "username",
      type: "text",
      placeholder: "John Doe",
      icon: <User size={20} />,
      value: user?.username,
      label: "Full Name",
    },
    {
      name: "phone",
      type: "tel",
      placeholder: "+977 9812345678",
      icon: <Phone size={20} />,
      value: user?.phone,
      label: "Phone Number",
    },
  ]);

  const validate = () => {
    const newErrors = {};
    if (!fieldData.email) {
      newErrors.email = "Email is required";
    } else if (!fieldData.email.trim()) {
      newErrors.email = "Email cannot be empty";
    } else if (!/^[\w.-]+@[\w.-]+\.[A-Z]{2,4}$/i.test(fieldData.email.trim())) {
      newErrors.email = "Invalid email address";
    }
    if (!fieldData.username || !fieldData.username.trim()) {
      newErrors.username = "Invalid Username";
    }
    if (!fieldData.phone || fieldData.phone.length < 10) {
      newErrors.phone = "Invalid Contact Number";
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
        `${import.meta.env.VITE_backendUrl}/api/auth/edit-profile`,
        {
          token: localStorage.getItem("token"),
          _id: user?._id,
          username: fieldData.username,
          phone: fieldData.phone,
        }
      );
      if (res.status === 200) {
        setUser(res.data.user);
        setLoading(false);
        setFields((prev) => {
          const newArr = [...prev];
          newArr[1].value = res.data.user.username;
          newArr[2].value = res.data.user.phone;
          return newArr;
        });
        setSuccess("Profile updated successfully.");
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setBackendError(err.message);
    }
  };

  const [fieldData, setFieldData] = useState({
    email: user?.email,
    username: user?.username,
    phone: user?.phone,
  });

  const handleCountryChange = (code) => {
    setSelectedCountry(code);
    setIsDropdownOpen(false);
    const fullNumber = phoneNumber ? `${code} ${phoneNumber}` : code;
    setFieldData((prev) => ({
      ...prev,
      phone: fullNumber,
    }));
  };

  const handlePhoneNumberChange = (e) => {
    const number = e.target.value.replace(/[^\d]/g, "");
    setPhoneNumber(number);
    const fullNumber = number
      ? `${selectedCountry} ${number}`
      : selectedCountry;
    setFieldData((prev) => ({
      ...prev,
      phone: fullNumber,
    }));
    setErrors((prev) => ({
      ...prev,
      phone: "",
    }));
  };

  const hasChanges =
    fields[1]?.value !== fieldData?.username ||
    fields[2]?.value !== fieldData?.phone;

  const selectedCountryData = countryCodes.find(
    (c) => c.code === selectedCountry
  );

  return (
    <div className="max-w-3xl mx-auto bg-red-500 h-full flex items-center justify-center flex-col">
     

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


      {/* Edit Form */}
      <div className="w-full py-6 border-b border-zinc-200">
        <h2 className="text-3xl font-bold ">Account Information</h2>

        <form
          onSubmit={(e) => handleSubmit(e)}
          className="space-y-4"
        >
          {fields.map((field, i) => (
            <div key={i}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-zinc-900 mb-1.5"
              >
                {field.label}
              </label>

              {field.name === "phone" ? (
                // Phone Input with Country Code
                <div className="relative">
                  <div className="flex gap-2">
                    {/* Country Code Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`h-11 px-3 flex items-center gap-2 border rounded-lg transition-all ${
                          errors.phone
                            ? "border-red-500"
                            : "border-zinc-300 hover:border-zinc-400"
                        } bg-white hover:bg-zinc-50`}
                      >
                        <span className="text-xl">
                          {selectedCountryData?.flag}
                        </span>
                        <span className="text-sm font-medium text-zinc-900">
                          {selectedCountry}
                        </span>
                        <ChevronDown
                          size={16}
                          className="text-zinc-500"
                        />
                      </button>

                      {/* Dropdown */}
                      {isDropdownOpen && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsDropdownOpen(false)}
                          />

                          {/* Dropdown Menu */}
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                            {countryCodes.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() =>
                                  handleCountryChange(country.code)
                                }
                                className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors ${
                                  selectedCountry === country.code
                                    ? "bg-blue-50"
                                    : ""
                                }`}
                              >
                                <span className="text-xl">{country.flag}</span>
                                <div className="flex-1 text-left">
                                  <div className="text-sm font-medium text-zinc-900">
                                    {country.country}
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {country.code}
                                  </div>
                                </div>
                                {selectedCountry === country.code && (
                                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder="9812345678"
                      className={`flex-1 h-11 px-3 text-sm border rounded-lg ${
                        errors.phone
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-zinc-300 focus:border-black focus:ring-1 focus:ring-black"
                      } bg-white text-zinc-900 focus:outline-none transition-all`}
                    />
                  </div>
                </div>
              ) : (
                // Regular Input Fields
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    disabled={field.name === "email"}
                    type={field.type}
                    value={fieldData[field.name]}
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
                    className={`w-full h-11 px-3 text-sm border rounded-lg ${
                      errors[field.name]
                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-zinc-300 focus:border-black focus:ring-1 focus:ring-black"
                    } ${
                      field.name === "email"
                        ? "bg-zinc-50 text-zinc-500 cursor-not-allowed"
                        : "bg-white text-zinc-900"
                    } focus:outline-none transition-all`}
                    placeholder={field.placeholder}
                  />
                </div>
              )}

              {errors[field.name] && (
                <p className="text-xs text-red-600 mt-1.5">
                  {errors[field.name]}
                </p>
              )}
              {field.name === "email" && (
                <p className="text-xs text-zinc-500 mt-1.5">
                  Email cannot be changed
                </p>
              )}
            </div>
          ))}
        </form>
      </div>

      {/* Action Buttons */}
      <div className="w-full py-4 bg-white border-t border-zinc-200 sticky bottom-0 md:static">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={loading || !hasChanges}
            type="submit"
            onClick={handleSubmit}
            className={`flex-1 cursor-pointer h-10 px-4 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 ${
              loading || !hasChanges
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
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {/* Additional Settings Section */}
    </div>
  );
};

export default EditProfile;
