import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  MoreVertical,
  User,
  Volume,
  VolumeOff,
  MoveRightIcon,
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const REELS_DATA = [
  {
    id: "1",
    videoSrc:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Big Buck Bunny - Classic short film",
    channelHandle: "@blendercfn",
    likes: 12400,
    comments: 892,
  },
  {
    id: "2",
    videoSrc:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    title: "Elephants Dream - Open movie project",
    channelHandle: "@orange_blender",
    likes: 8300,
    comments: 456,
  },
  {
    id: "3",
    videoSrc:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "For Bigger Blazes - Short clip",
    channelHandle: "@sample_vids",
    likes: 21500,
    comments: 1203,
  },
  {
    id: "4",
    videoSrc:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    title: "Sintel - Epic fantasy short",
    channelHandle: "@durian_blender",
    likes: 67200,
    comments: 3421,
  },
  {
    id: "5",
    videoSrc:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    title: "Tears of Steel - Sci-fi short",
    channelHandle: "@mango_blender",
    likes: 44100,
    comments: 1890,
  },
];

const Reels = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Play only the reel in view, pause others
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.reelId;
          const video = videoRefs.current[id];
          if (!video) return;
          if (entry.isIntersecting) {
            video.currentTime = 0;
            video.play().catch(() => {});
            setActiveIndex(REELS_DATA.findIndex((r) => r.id === id));
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6, root: container, rootMargin: "0px" }
    );

    REELS_DATA.forEach((reel) => {
      const el = document.querySelector(`[data-reel-id="${reel.id}"]`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
  const togglePlay = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const speedUp = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    video.playbackRate = 2;
  };

  const resetSpeed = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    video.playbackRate = 1;
  };

  return (
    <div className="fixed right-0  w-full h-full bg-black z-[100] flex flex-col items-center justify-center">
      <div className="max-w-xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="w-full  absolute top-0 left-0 right-0 flex items-center justify-center p-3 px-1 z-[2000] bg-gradient-to-b from-black/60 to-transparent">
          <div className="w-full max-w-xl flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h3 className="font-bold text-white text-lg">Reels</h3>
            <span className="flex items-center gap-">
              <button
                onClick={() => {
                  isMuted ? setIsMuted(false) : setIsMuted(true);
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Volume"
              >
                {isMuted ? (
                  <VolumeOff className="w-6 h-6  text-white transition-all cursor-pointer flex items-center justify-center" />
                ) : (
                  <Volume className="w-6 h-6  text-white transition-all cursor-pointer flex items-center justify-center" />
                )}

                {/* <MoreVertical className="w-6 h-6 text-white" /> */}
              </button>
              <button
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="More"
              >
                <MoreVertical className="w-6 h-6 text-white" />
              </button>
            </span>
          </div>
        </div>

        {/* Scrollable reels container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {REELS_DATA.map((reel, i) => (
            <section
              key={reel.id}
              data-reel-id={reel.id}
              className="relative w-full h-full min-h-screen snap-start snap-always flex-shrink-0"
            >
              {/* Video */}
              <video
                ref={(el) => (videoRefs.current[reel.id] = el)}
                src={reel.videoSrc}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                onClick={() => togglePlay(reel.id)}
                onMouseDown={() => speedUp(reel.id)} // desktop hold
                onMouseUp={() => resetSpeed(reel.id)}
                onTouchStart={() => speedUp(reel.id)} // mobile hold
                onTouchEnd={() => resetSpeed(reel.id)}
              />

              {/* Right side actions (Instagram style) */}
              <div className="absolute right-2 bottom-75 flex flex-col items-center justify-center gap-5 z-[1000]">
                <div className="flex flex-col items-center justify-center">
                  <Link
                    to={`/view/${reel.id}`}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <MoveRightIcon className="w-8 h-8 text-white" />
                  </Link>
                </div>

                {/* <div className="flex flex-col items-center">
                <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <MessageCircle className="w-8 h-8 text-white" />
                </button>
                <span className="text-xs text-white font-medium">
                  {reel.comments.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <Send className="w-8 h-8 text-white rotate-45" />
                </button>
                <span className="text-xs text-white mt-1">Share</span>
              </div> */}
              </div>

              {/* Bottom overlay: channel, title */}
              <div className="w-full absolute left-0 right-0 bottom-0 p-2 py-6 z-[1000] text-white bg-gradient-to-b from-black/20 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-sm flex items-center">
                    {reel.channelHandle}
                  </span>
                </div>
                <p className="text-sm text-white/95 line-clamp-2 drop-shadow-lg">
                  {reel.title}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reels;
