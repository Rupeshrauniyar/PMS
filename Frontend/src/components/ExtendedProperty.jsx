import React, { useContext, useState } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ImageIcon,
} from "lucide-react";

const ExtendedProperty = (props) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const nextImage = () => {
    setImageLoading(true);
    setCurrentImageIndex((prev) => (prev + 1) % props.props.images?.length);
  };

  const prevImage = () => {
    setImageLoading(true);
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + props.props.images?.length) % props.props.images?.length
    );
  };

  if (!props.props._id) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <h3 className="text-center font-bold text-xl">
          No properties available
        </h3>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4">
      {/* Image Gallery */}
      <div className="overflow-hidden animate-[fadeIn_0.5s_ease-out]">
        <div className="relative group">
          <div className="relative w-full h-[300px] md:h-[350px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
            {console.log(currentImageIndex)}
            <img
              src={
                props.props.images?.[currentImageIndex] ||
                props.props.images?.[0]
              }
              alt={props.props.title}
              className={`relative w-full h-full object-cover xl:object-contain z-15 transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setImageLoading(false)}
              loading="lazy"
            />

            {/* Background Blur */}
            <div
              className="absolute inset-0 bg-no-repeat bg-center bg-cover filter blur-lg transform scale-110 z-5"
              style={{
                backgroundImage: `url(${
                  props.props.images?.[currentImageIndex] ||
                  props.props.images?.[0]
                })`,
              }}
            ></div>

            {/* Counter */}
            <div className="absolute z-30 top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {currentImageIndex + 1} / {props.props.images?.length || 0}
            </div>

            {/* Arrows */}
            {props.props.images?.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div className="py-2 border-t border-gray-100">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
              {props.props.images?.map((img, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (currentImageIndex !== index) {
                      setImageLoading(true);
                      setCurrentImageIndex(index);
                    }
                  }}
                  className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    currentImageIndex === index
                      ? "border-black ring-1 ring-blue-100"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className=" animate-[slideUp_0.5s_ease-out]">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {props.props.title}
        </h1>

        <p
          className={`text-gray-600 text-sm leading-relaxed transition-all ${
            !showFullDescription && props.props.description.length > 80
              ? "line-clamp-2"
              : ""
          }`}
        >
          {props.props.description}
        </p>

        {props.props.description.length > 80 && (
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            {showFullDescription ? "Show Less" : "Read More"}
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                showFullDescription ? "-rotate-90" : "rotate-90"
              }`}
            />
          </button>
        )}

        {/* Property Details */}
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {props.props.area > 0 ? (
            <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
              <Maximize className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
              <span>{props.props.area}</span>
            </div>
          ) : null}
          <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
            <Bed className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
            <span>
              {props.props.rooms} {props.props.rooms === 1 ? "Room" : "Rooms"}
            </span>
          </div>
          <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm w-40 ">
            <MapPin className="w-4 h-4 mr-1 text-gray-500 " />
            <span className="truncate w-[85%]">{props.props.location}</span>
          </div>
          <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm">
            <Bath className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
            <span>
              {props.props.washrooms}{" "}
              {props.props.washrooms === 1 ? "Bathroom" : "Bathrooms"}
            </span>
          </div>
        </div>
        {!props.price ? (
          <span className="text-gray-900 text-2xl font-bold">
            ₹
            {props.props.price
              ? new Intl.NumberFormat("en-IN").format(props.props.price)
              : "N/A"}
          </span>
        ) : (
          <div className="flex flex-col">
            {Number(props.props.price) === Number(props.price) ? (
              <span className="text-gray-900 text-2xl font-bold">
                ₹
                {props.props.price
                  ? new Intl.NumberFormat("en-IN").format(props.props.price)
                  : "N/A"}
              </span>
            ) : (
              <>
                <div className="flex gap-4">
                  <span className="text-gray-400 text-2xl  line-through">
                    ₹
                    {props.props.price
                      ? new Intl.NumberFormat("en-IN").format(props.props.price)
                      : "N/A"}
                  </span>
                  <div className="flex items-center">
                    <span className="text-gray-900 text-2xl font-bold">
                      ₹
                      {props.price
                        ? new Intl.NumberFormat("en-IN").format(props.price)
                        : "N/A"}
                    </span>
                    <h1>(Bargained)</h1>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Save & Book Buttons */}
    </div>
  );
};

export default ExtendedProperty;
