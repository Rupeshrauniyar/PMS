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
import {
  Autoplay,
  FreeMode,
  Thumbs,
  Pagination,
  EffectFade,
} from "swiper/modules";

const SwiperComp = ({ title, images = [] }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  const defaultImages = [
    { src: "./Room.webp", alt: "Room" },
    { src: "./House.webp", alt: "House" },
    { src: "./Plot.webp", alt: "Plot" },
  ];

  const imagesToDisplay =
    images.length > 0
      ? images.map((src) => ({ src, alt: "Property Image" }))
      : defaultImages;

  return (
    <div className="relative w-full  overflow-hidden shadow-xl rounded-3xl">
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
          bulletClass:
            "swiper-pagination-bullet bg-white/60 rounded-full transition-all duration-300 ease-in-out",
          bulletActiveClass:
            "swiper-pagination-bullet-active bg-white w-6 rounded-full",
        }}
        thumbs={{ swiper: thumbsSwiper }}
        modules={[Autoplay, FreeMode, Thumbs, Pagination, EffectFade]}
        className="mySwiper2"
      >
        {imagesToDisplay.map((item, index) => (
          <SwiperSlide key={index}>
            <div
              className={`relative w-full h-[220px] sm:h-[300px] ${
                images.length > 0 ? "xl:h-[280px]" : "xl:h-[390px]"
              } group flex flex-col items-center`}
            >
              <img
                src={item.src}
                alt={item.alt}
                className="xl:w-[50%] w-full h-full object-cover  transform  transition-transform duration-700 ease-in-out"
              />
              {/* Blurred Background */}
              <div
                className="absolute inset-0 bg-no-repeat bg-center bg-cover filter blur-lg transform scale-110 -z-10"
                style={{ backgroundImage: `url(${item.src})` }}
              ></div>
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              {/* Caption (Optional) */}

              <div className="absolute bottom-5 left-4 text-white text-lg font-semibold drop-shadow-lg">
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
