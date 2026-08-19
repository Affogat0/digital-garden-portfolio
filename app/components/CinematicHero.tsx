"use client";

import { MutableRefObject, useEffect, useRef } from "react";

type CinematicHeroProps = {
  onReady?: () => void;
};

function calculateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

function useVideoTimelineController(videoRef: MutableRefObject<HTMLVideoElement | null>, onReady?: () => void) {
  const readyCalledRef = useRef(false);

  useEffect(() => {
    let frame = 0;

    const updateTimeline = () => {
      const video = videoRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const finalFrame = Math.max(0, video.duration - 0.04);
        const nextTime = calculateScrollProgress() * finalFrame;
        if (Math.abs(video.currentTime - nextTime) > 0.016) video.currentTime = nextTime;
      }
      frame = 0;
    };

    const requestTimelineUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateTimeline);
    };

    const handleMetadata = () => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      requestTimelineUpdate();
      if (!readyCalledRef.current) {
        readyCalledRef.current = true;
        onReady?.();
      }
    };

    const video = videoRef.current;
    video?.addEventListener("loadedmetadata", handleMetadata);
    if (video?.readyState && video.readyState >= HTMLMediaElement.HAVE_METADATA) handleMetadata();
    window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
    window.addEventListener("resize", requestTimelineUpdate, { passive: true });
    requestTimelineUpdate();

    return () => {
      video?.removeEventListener("loadedmetadata", handleMetadata);
      window.removeEventListener("scroll", requestTimelineUpdate);
      window.removeEventListener("resize", requestTimelineUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [onReady, videoRef]);
}

export function CinematicHero({ onReady }: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoTimelineController(videoRef, onReady);

  return (
    <div className="cinematic-hero" aria-hidden="true">
      <video
        ref={videoRef}
        className="cinematic-hero-video"
        src="/cinematic-bird.mp4"
        preload="auto"
        muted
        playsInline
        tabIndex={-1}
      />
    </div>
  );
}
