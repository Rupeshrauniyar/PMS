import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

// Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

// Modules
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

const SwiperComp = ({ title, images = [] }) => {
  if (images.length < 1) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 text-center ">
          Image(s) are being processed
        </h3>
        <p className="text-sm text-gray-500 text-center ">
          Please check back in a few moments.
        </p>
        
      </div>
    );
  }
  const imagesToDisplay = images.map((src) => ({ src, alt: "Property Image" }));

  return (
    <div className="relative w-full h-full overflow-hidden shadow-xl ">
      {/* {console.log(images)} */}
      <Swiper
        autoplay={
          images.length > 0
            ? false
            : {
                delay: 3000,
                disableOnInteraction: false,
              }
        }
        effect="fade"
        fadeEffect={{ crossFade: true }}
        style={{
          "--swiper-navigation-color": "#28a745",
          "--swiper-pagination-color": "#28a745",
        }}
        spaceBetween={0}
        loop={imagesToDisplay.length > 1 ? true : false}
        pagination={{
          clickable: true,
          className: "bg-black",

          bulletClass:
            "swiper-pagination-bullet bg-black rounded-full transition-all duration-300 ease-in-out",
          bulletActiveClass:
            "swiper-pagination-bullet-active bg-white w-6 rounded-full",
        }}
        // thumbs={{ swiper: thumbsSwiper }}
        modules={[Autoplay, Pagination, EffectFade]}
        className="mySwiper2 flex flex-col items-center justify-center"
      >
        {imagesToDisplay.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="flex items-center justify-center w-full h-full">
              <img
                src={item.src}
                alt={item.alt}
                className=" w-full h-[280px] object-cover xl:object-contain  transform  transition-transform duration-700 ease-in-out"
              />
              {/* Blurred Background */}
              <div
                className="absolute inset-0 bg-no-repeat bg-center bg-cover filter blur-lg transform scale-110 -z-10"
                style={{ backgroundImage: `url(${item.src})` }}
              ></div>
              {/* Gradient Overlay */}
              {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div> */}
              {/* Caption (Optional) */}

              <div className="absolute bottom-6 left-4 text-white text-lg font-semibold drop-shadow-lg">
                {title}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperComp;
