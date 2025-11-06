import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Tag, Bed, Bath, Ruler, MapPin } from "lucide-react";
import SwiperComp from "./Swiper";
import { AppContext } from "../contexts/AppContextx";

const Properties = (props) => {

  if (!props.prop) {
    return <></>
  }
  let nav = `/view/${props.prop?._id}`;
  const {user} = useContext(AppContext);
  if (user?.myProperties?.some((myProp) => myProp.propId === props.prop._id)) {

    nav = `/my/${props.prop?._id}`;
  } else if (
    user?.bookedProperties?.some(
      (bookProp) => bookProp.propId === props.prop._id
    )
  ) {
 
    nav = `/booked/${props.prop?._id}`;
  }
  return (
    <Link
      to={nav}
      className="block"
    >
      <div className="w-full h-full bg-white border border-zinc-200 rounded-3xl overflow-hidden hover:border-zinc-400 transition-all duration-200 group ">
        {/* Image Section */}
        <div className=" relative overflow-hidden aspect-[16/9] bg-zinc-100 ">
          <SwiperComp
            title={props.prop.title}
            images={props.prop.images}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Selling Type Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-medium rounded-md">
              <Tag size={12} />
              {props.prop.sellingType}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title - Now visible */}
          {/* <h3 className="text-base font-semibold text-zinc-900 mb-1 line-clamp-1">
            {props.prop.title}
          </h3> */}

          {/* Description */}
          <p className="text-zinc-600 text-sm mb-3 line-clamp-2 truncate">
            {props.prop.description}
          </p>

          {/* Property Details Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {props.prop.rooms > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-700">
                <Bed
                  size={16}
                  className="text-zinc-500 flex-shrink-0"
                />
                <span className="text-sm">{props.prop.rooms} Rooms</span>
              </div>
            )}

            {props.prop.washrooms > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-700">
                <Bath
                  size={16}
                  className="text-zinc-500 flex-shrink-0"
                />
                <span className="text-sm">{props.prop.washrooms} Baths</span>
              </div>
            )}

            {props.prop.area > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-700">
                <Ruler
                  size={16}
                  className="text-zinc-500 flex-shrink-0"
                />
                <span className="text-sm">{props.prop.area} sq ft</span>
              </div>
            )}

            {props.prop.location && (
              <div className="flex items-center gap-1.5 text-zinc-700">
                <MapPin
                  size={16}
                  className="text-zinc-500 flex-shrink-0"
                />
                <span className="text-sm truncate">{props.prop.location}</span>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-zinc-900">
                रू. {new Intl.NumberFormat("en-IN").format(props.prop.price)}
              </span>
              {props.prop.sellingType === "Rent System" && (
                <span className="text-sm text-zinc-600">/month</span>
              )}
            </div>
            {/* <button className="text-sm font-medium text-black hover:underline">
              View Details →
            </button> */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Properties;
