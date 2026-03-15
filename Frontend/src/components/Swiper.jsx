import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// Modules
import { Pagination, Autoplay } from "swiper/modules";

const SwiperComp = ({ title, images = [] }) => {
  if (images.length < 1) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 text-center">
          Image(s) are being processed
        </h3>
        <p className="text-sm text-gray-500 text-center">
          Please check back in a few moments.
        </p>
      </div>
    );
  }

  const imagesToDisplay = images.map((src) => ({
    src,
    alt: "Property Image",
  }));

  return (
    <div className="relative w-full h-full overflow-hidden shadow-xl z-10">
      <Swiper
        speed={200}
        spaceBetween={0}
        loop={false}
        pagination={{
          clickable: true,
          bulletClass:
            "swiper-pagination-bullet bg-black rounded-full transition-all duration-300 ease-in-out",
          bulletActiveClass:
            "swiper-pagination-bullet-active bg-white w-6 rounded-full",
        }}
        modules={[Pagination]}
        className="mySwiper2 flex flex-col items-center justify-center z-[1]"
      >
        {imagesToDisplay.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="flex items-center justify-center w-full h-full aspect-[16/9] relative z-[1]">
              <img
                src={item.src}
                loading="lazy"
                alt={item.alt}
                className="object-cover w-full h-full z-[1]"
              />

              {/* Blurred Background */}
              <div
                className="absolute inset-0 bg-no-repeat bg-center bg-cover blur-lg scale-110 -z-10"
                style={{ backgroundImage: `url(${item.src})` }}
              />
            </div>
          </SwiperSlide>
        ))}

        {/* Title */}
        <div className="absolute bottom-6 left-4 text-white text-lg font-semibold drop-shadow-lg z-[100]">
          {title?.length > 20 ? title.slice(0, 20) + "..." : title}
        </div>
      </Swiper>
    </div>
  );
};

export default SwiperComp;
