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
  Building2,
  Tag,
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
        (prev - 1 + props.props.images?.length) % props.props.images?.length,
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
  const detailItems = [
   
 
    {
      label: "Rooms",
      value:
        props.props?.propertyType === "Plot"
          ? "Not applicable"
          : `${props.props?.rooms ?? 0} ${Number(props.props?.rooms) === 1 ? "Room" : "Rooms"}`,
      icon: Bed,
    },
    {
      label: "Washrooms",
      value:
        props.props?.propertyType === "Plot"
          ? "Not applicable"
          : `${props.props?.washrooms ?? 0} ${
              Number(props.props?.washrooms) === 1 ? "Bathroom" : "Bathrooms"
            }`,
      icon: Bath,
    },
   
    {
      label: "Location",
      value: props.props?.location || "N/A",
      icon: MapPin,
    },
  ];
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4">
      {/* Image Gallery */}
      <div className="overflow-hidden animate-[fadeIn_0.5s_ease-out]">
        <div className="relative group">
          <div className="relative w-full h-[200px] md:h-[350px] rounded-2xl bg-muted overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {/* {console.log(currentImageIndex)} */}
            <img
              src={
                props.props.images?.[currentImageIndex] ||
                props.props.images?.[0]
              }
              alt={props.props.title}
              className={`relative w-full h-full object-cover xl:object-contain z-10 transition-opacity duration-300 ${
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer border border-border"
                >
                  <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer border border-border"
                >
                  <ChevronRight className="w-6 h-6 text-foreground" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div className="py-2 border-t border-border">
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
                      ? "border-foreground ring-1 ring-ring/30"
                      : "border-border"
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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {props.props.title}
        </h1>

        <p
          className={`text-muted-foreground text-sm leading-relaxed transition-all ${
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
            className="text-foreground hover:text-foreground/80 text-sm font-medium flex items-center gap-1"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detailItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-3"
              >
                <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </p>
                <p className="text-sm font-medium text-zinc-900 wrap-break-word">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
        {!props.price ? (
          <span className="text-foreground text-2xl font-bold">
            ₹
            {props.props.price
              ? new Intl.NumberFormat("en-IN").format(props.props.price)
              : "N/A"}
          </span>
        ) : (
          <div className="flex flex-col">
            {Number(props.props.price) === Number(props.price) ? (
              <span className="text-foreground text-2xl font-bold">
                ₹
                {props.props.price
                  ? new Intl.NumberFormat("en-IN").format(props.props.price)
                  : "N/A"}
              </span>
            ) : (
              <>
                <div className="flex gap-4">
                  <span className="text-muted-foreground text-2xl line-through">
                    ₹
                    {props.props.price
                      ? new Intl.NumberFormat("en-IN").format(props.props.price)
                      : "N/A"}
                  </span>
                  <div className="flex items-center">
                    <span className="text-foreground text-2xl font-bold">
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
