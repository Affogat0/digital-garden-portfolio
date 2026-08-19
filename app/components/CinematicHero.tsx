"use client";

import { MutableRefObject, useEffect, useRef } from "react";

type CinematicHeroProps = {
  onReady?: () => void;
};

type TimelineState = "intro" | "arrived" | "past";

function calculateLandingProgress() {
  const landing = document.getElementById("top");
  if (!landing) return 0;
  const start = landing.offsetTop;
  const distance = Math.max(1, landing.offsetHeight);
  return Math.min(1, Math.max(0, (window.scrollY - start) / distance));
}

function getTimelineState(progress: number): TimelineState {
  const laboratory = document.getElementById("laboratory");
  if (laboratory && window.scrollY >= laboratory.offsetTop + laboratory.offsetHeight) return "past";
  return progress >= 1 ? "arrived" : "intro";
}

function useVideoTimelineController(
  videoRef: MutableRefObject<HTMLVideoElement | null>,
  containerRef: MutableRefObject<HTMLDivElement | null>,
  onReady?: () => void,
) {
  const readyCalledRef = useRef(false);
  const timelineStateRef = useRef<TimelineState>("intro");

  useEffect(() => {
    let frame = 0;

    const updateTimeline = () => {
      const video = videoRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const progress = calculateLandingProgress();
        const finalFrame = Math.max(0, video.duration - 0.04);
        const nextTime = progress * finalFrame;
        if (Math.abs(video.currentTime - nextTime) > 0.016) video.currentTime = nextTime;

        const timelineState = getTimelineState(progress);
        if (timelineState !== timelineStateRef.current) {
          timelineStateRef.current = timelineState;
          if (containerRef.current) containerRef.current.dataset.timelineState = timelineState;
        }
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
  }, [containerRef, onReady, videoRef]);
}

export function CinematicHero({ onReady }: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useVideoTimelineController(videoRef, containerRef, onReady);

  return (
    <div ref={containerRef} className="cinematic-hero" data-timeline-state="intro" aria-hidden="true">
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
