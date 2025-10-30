import React, { useContext, useEffect } from "react";
import SwiperComp from "../components/Swiper";
import {
  Banknote,
  Building,
  HousePlus,
  MapPin,
  Tag,
  Bed,
  Bath,
  Ruler,
  PlusCircle,
  Loader2,
  BathIcon,
  DoorClosed,
  DoorOpen,
  Heading,
  LayoutDashboard,
  Image,
  ImagePlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import AlertBox from "../components/AlertBox";
import { AppContext } from "../contexts/AppContextx";
const AddProperty = () => {
  const { setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Store both file objects and their URLs for preview
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const validate = () => {
    const newErrors = {};

    if (!propertyDetails.title.trim()) {
      newErrors.title = "Property title is required";
    } else if (propertyDetails.title.trim().length < 3) {
      newErrors.title = "Property title must be at least 3 characters long";
    }

    if (!propertyDetails.description.trim()) {
      newErrors.description = "Property description is required";
    } else if (propertyDetails.description.trim().length < 20) {
      newErrors.description =
        "Property description must be at least 20 characters long";
    }

    if (propertyDetails.rooms <= 0) {
      newErrors.rooms = "Number of rooms must be a positive value";
    }

    if (propertyDetails.washrooms <= 0) {
      newErrors.washrooms = "Number of washrooms must be a positive value";
    }

    if (propertyDetails.propertyType !== "Room" && propertyDetails.area <= 0) {
      newErrors.area =
        "Area must be a positive value for selected property type";
    }

    if (propertyDetails.price <= 0) {
      newErrors.price = "Price must be a positive value";
    }

    if (!propertyDetails.location.trim()) {
      newErrors.location = "Property location is required";
    } else if (propertyDetails.location.trim().length < 5) {
      newErrors.location =
        "Property location must be at least 5 characters long";
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  // useEffect(() => {
  //   const handleBeforeUnload = (event) => {
  //     event.preventDefault();
  //     const confirmed = window.confirm("Are you sure you want to go back?");
  //     if (confirmed) {
  //       navigate(-1); // Go back
  //     } else {
  //       window.history.pushState(null, "", window.location.href);
  //     }
  //   };

  //   window.history.pushState(null, "", window.location.href);
  //   window.addEventListener("popstate", handleBeforeUnload);

  //   return () => {
  //     window.removeEventListener("popstate", handleBeforeUnload);
  //   };
  // }, [navigate]);

  const [propertyDetails, setPropertyDetails] = useState({
    title: "",
    sellingType: "Rent System",
    propertyType: "Room",
    description: "",
    rooms: 0,
    washrooms: 0,
    area: 0,
    price: 0,
    location: "",
    token: localStorage.getItem("token"),
  });

  const handlePropertyDetailsChange = (e) => {
    const { id, value } = e.target;
    if (id === "price") {
      const rawValue = value.replace(/,/g, ""); // remove commas
      if (!isNaN(rawValue)) {
        setPropertyDetails((prev) => ({ ...prev, [id]: rawValue }));
      }
    } else {
      setPropertyDetails((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleAddProp = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);
    const formData = new FormData();

    // Append property details
    for (const key in propertyDetails) {
      formData.append(key, propertyDetails[key]);
    }

    // Append images
    images.forEach((image, index) => {
      formData.append(`images`, image.file);
    });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/add-property`,
        formData
      );

      if (response.status === 200) {
        setLoading(false);
        setSuccess("Property added successfully");
        setUser((prev) => ({
          ...prev,
          myProperties: [
            ...prev.myProperties,
            { propId: response.data.property },
          ],
        }));
        // alert("Property added successfully!");
        // Optionally navigate or reset form
      } else {
        setLoading(false);
        // alert("Failed to add property.");
        setBackendError(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      setBackendError("Something went wrong");
      console.error("Error adding property:", error);
      // alert("An error occurred while adding property.");
    }
  };

  return (
    <div className="w-full min-h-screen mt-18 font-sans antialiased pb-12  ">
      {success && (
        <AlertBox
          message={success}
          type="success"
          onClose={() => {
            navigate("/profile");
            setBackendError(null);
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
      <h3 className="text-3xl font-bold  ">Add Property</h3>
      <p className=" text-gray-600 mb-2 ">
        List your property for rent or sale. Fill in the details below to reach
        potential buyers or tenants.
      </p>
      <div className=" grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="w-full mb-8">
          <div className="w-full flex items-center justify-center">
            <div className="w-full bg-white/80 backdrop-blur-xl border rounded-3xl border-zinc-200/60 shadow-lg overflow-hidden transform hover:scale-[1.01] hover:shadow-2xl transition-all duration-300">
              <div
                className="flex items-start justify-center"
                onDragOver={(e) => handleDragOver(e)}
                onDrop={(e) => handleDrop(e)}
              >
                <label
                  htmlFor="images"
                  className="w-full h-full cursor-pointer border border-zinc-300 rounded-t-2xl overflow-hidden bg-zinc-50 hover:bg-zinc-100 transition-all"
                >
                  {images.length > 0 ? (
                    <SwiperComp images={images.map((img) => img.url)} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-zinc-600">
                      <ImagePlus size={50} />
                      <p className="mt-3 text-sm">
                        Drag or click to add images
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              {errors.images && (
                <p className="text-red-500 text-xs text-center mt-1">
                  {errors.images}
                </p>
              )}
              <div className="p-3">
                <h3 className="text-base font-semibold text-zinc-900 mb-1">
                  {propertyDetails.title || "Add Property Title"}
                </h3>
                <p className="text-zinc-600 text-xs mb-2 truncate">
                  {propertyDetails.description || "Add Property Description"}
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-zinc-700 mb-2">
                  <div className="flex items-center">
                    <Tag
                      size={12}
                      className="mr-1 text-zinc-500"
                    />
                    <span className="truncate">
                      {propertyDetails.sellingType}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Building
                      size={12}
                      className="mr-1 text-zinc-500"
                    />
                    <span className="truncate">
                      {propertyDetails.propertyType}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Bed
                      size={12}
                      className="mr-1 text-zinc-500"
                    />
                    <span className="truncate">
                      {propertyDetails.rooms} Rooms
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Bath
                      size={12}
                      className="mr-1 text-zinc-500"
                    />
                    <span className="truncate">
                      {propertyDetails.washrooms} Baths
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Ruler
                      size={12}
                      className="mr-1 text-zinc-500"
                    />
                    <span className="truncate">
                      {propertyDetails.area} sq ft
                    </span>
                  </div>

                  <div className="flex items-center">
                    <MapPin
                      size={12}
                      className="mr-1 text-zinc-500"
                    />
                    <span className="truncate">
                      {propertyDetails.location || "Add Property Location"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-base font-bold text-zinc-900">
                    रू.{propertyDetails.price || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <form
          className=" space-y-6 pb-15"
          onSubmit={handleAddProp}
        >
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Property Title
            </label>
            <div className="relative">
              <LayoutDashboard
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                id="title"
                placeholder="e.g., Beautiful Family House"
                className="input-field pl-10"
                value={propertyDetails.title}
                onChange={handlePropertyDetailsChange}
              />
            </div>

            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Type
              </label>
              <div className="relative">
                <Tag
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  id="sellingType"
                  className="input-field px-10"
                  value={propertyDetails.sellingType}
                  onChange={handlePropertyDetailsChange}
                >
                  <option value={"Rent System"}>Rent System</option>
                  <option value={"Selling System"}>Selling System</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <div className="relative">
                <Building
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  id="propertyType"
                  className="input-field px-10"
                  value={propertyDetails.propertyType}
                  onChange={handlePropertyDetailsChange}
                >
                  <option value={"Room"}>Room</option>
                  <option value={"House"}>House</option>
                  <option value={"Plot"}>Plot</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Property Description
            </label>
            <textarea
              id="description"
              placeholder="Enter property description"
              rows="4"
              style={{ resize: "none" }}
              className=" py-1 no-resize  w-full h-21 rounded-xl border border-zinc-300  text-sm focus:ring-2 focus:ring-black px-2 outline-none"
              value={propertyDetails.description}
              onChange={handlePropertyDetailsChange}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2  gap-6">
            <div>
              <label
                htmlFor="rooms"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Number of Rooms
              </label>
              <div className="relative">
                <DoorOpen
                  size={22}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="number"
                  id="rooms"
                  placeholder="e.g., 3"
                  className="input-field pl-10"
                  value={propertyDetails.rooms}
                  onChange={handlePropertyDetailsChange}
                />
              </div>
              {errors.rooms && (
                <p className="text-red-500 text-xs mt-1">{errors.rooms}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="washrooms"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Number of Washrooms
              </label>
              <div className="relative">
                <BathIcon
                  size={22}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="number"
                  id="washrooms"
                  placeholder="e.g., 2"
                  className="input-field pl-10"
                  value={propertyDetails.washrooms}
                  onChange={handlePropertyDetailsChange}
                />
              </div>
              {errors.washrooms && (
                <p className="text-red-500 text-xs mt-1">{errors.washrooms}</p>
              )}
            </div>
          </div>
          <div
            className={`${
              propertyDetails.propertyType !== "Room" ? "grid grid-cols-2" : ""
            } gap-6`}
          >
            {propertyDetails.propertyType !== "Room" ? (
              <div>
                <label
                  htmlFor="area"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Area (sq ft)
                </label>
                <div className="relative">
                  <Ruler
                    size={22}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    id="area"
                    placeholder="e.g., 1500"
                    className="input-field pl-10"
                    value={propertyDetails.area}
                    onChange={handlePropertyDetailsChange}
                  />
                </div>
                {errors.area && (
                  <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                )}
              </div>
            ) : undefined}
            <div className="w-full ">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {propertyDetails.sellingType === "Rent System" ? (
                  <h3 className="flex">
                    Property Price/
                    <p className="text-blue-500 font-bold">Month</p>
                  </h3>
                ) : (
                  <>Property Price</>
                )}
              </label>
              <div className="relative  w-full">
                <Banknote
                  size={22}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  id="price"
                  placeholder="Property price"
                  className="input-field pl-10 "
                  value={
                    propertyDetails.price
                      ? new Intl.NumberFormat("en-In").format(
                          propertyDetails.price
                        )
                      : ""
                  }
                  onChange={handlePropertyDetailsChange}
                />
              </div>
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Location
            </label>
            <div className="relative">
              <MapPin
                size={22}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                id="location"
                placeholder="Enter property location"
                className="input-field pl-10"
                value={propertyDetails.location}
                onChange={handlePropertyDetailsChange}
              />
            </div>
            {errors.location && (
              <p className="text-red-500 text-xs mt-1">{errors.location}</p>
            )}
          </div>
          <div className="fixed bottom-14 xl:w-[80%] xl:left-[20%] xl:bottom-0 w-full left-0 transition-all bg-white border-t border-zinc-200 p-2">
            <button
              type="submit"
              className={`w-full cursor-pointer bg-black hover:bg-zinc-800 text-white font-medium px-6 py-3 rounded-xl transition-colors flex items-center justify-center`}
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin ml-1"
                />
              ) : (
                <>Add property</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
