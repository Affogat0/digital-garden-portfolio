"use client";

import { MutableRefObject, useEffect, useRef } from "react";

type CinematicHeroProps = {
  onReady?: () => void;
};

type TimelineState = "intro" | "arrived" | "past";

const FRAME_COUNT = 119;
const FRAME_PRELOAD_STEP = 6;

function getFrameSource(index: number) {
  return `/cinematic-frames/frame-${String(index).padStart(3, "0")}.webp`;
}

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

function drawImageCover(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  const renderWidth = Math.round(width * pixelRatio);
  const renderHeight = Math.round(height * pixelRatio);
  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth;
    canvas.height = renderHeight;
  }

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return;
  const scale = Math.max(renderWidth / image.naturalWidth, renderHeight / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.fillStyle = "#07100d";
  context.fillRect(0, 0, renderWidth, renderHeight);
  context.drawImage(image, (renderWidth - drawWidth) / 2, (renderHeight - drawHeight) / 2, drawWidth, drawHeight);
}

function useFrameSequenceController(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  containerRef: MutableRefObject<HTMLDivElement | null>,
  onReady?: () => void,
) {
  useEffect(() => {
    const cache = new Map<number, HTMLImageElement>();
    const keyframes = Array.from({ length: Math.ceil(FRAME_COUNT / FRAME_PRELOAD_STEP) }, (_, index) => index * FRAME_PRELOAD_STEP)
      .filter((index) => index > 0 && index < FRAME_COUNT - 1);
    let animationFrame = 0;
    let preloadTimer = 0;
    let requestedFrame = 0;
    let drawnFrame = -1;
    let timelineState: TimelineState = "intro";
    let readyCalled = false;
    let disposed = false;

    const drawFrame = (index: number) => {
      const canvas = canvasRef.current;
      const image = cache.get(index);
      if (!canvas || !image?.complete || !image.naturalWidth) return false;
      drawImageCover(canvas, image);
      drawnFrame = index;
      if (!readyCalled) {
        readyCalled = true;
        onReady?.();
      }
      return true;
    };

    const loadFrame = (index: number) => {
      if (index < 0 || index >= FRAME_COUNT || cache.has(index)) return;
      const image = new Image();
      image.decoding = "async";
      cache.set(index, image);
      image.addEventListener("load", () => {
        if (disposed) return;
        if (index === requestedFrame || drawnFrame < 0) drawFrame(index);
      }, { once: true });
      image.src = getFrameSource(index);
    };

    const drawClosestLoadedFrame = (target: number) => {
      if (drawFrame(target)) return;
      for (let distance = 1; distance < FRAME_COUNT; distance += 1) {
        if (drawFrame(target - distance) || drawFrame(target + distance)) return;
      }
    };

    const updateTimeline = () => {
      const progress = calculateLandingProgress();
      requestedFrame = Math.round(progress * (FRAME_COUNT - 1));
      loadFrame(requestedFrame);
      loadFrame(requestedFrame - 1);
      loadFrame(requestedFrame + 1);
      loadFrame(requestedFrame - 2);
      loadFrame(requestedFrame + 2);
      loadFrame(requestedFrame - 3);
      loadFrame(requestedFrame + 3);
      drawClosestLoadedFrame(requestedFrame);

      const nextTimelineState = getTimelineState(progress);
      if (nextTimelineState !== timelineState) {
        timelineState = nextTimelineState;
        if (containerRef.current) containerRef.current.dataset.timelineState = timelineState;
      }
      animationFrame = 0;
    };

    const requestTimelineUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateTimeline);
    };

    const preloadNextKeyframe = () => {
      const next = keyframes.shift();
      if (next === undefined || disposed) return;
      loadFrame(next);
      preloadTimer = window.setTimeout(preloadNextKeyframe, 100);
    };

    loadFrame(0);
    loadFrame(FRAME_COUNT - 1);
    preloadTimer = window.setTimeout(preloadNextKeyframe, 350);
    window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
    window.addEventListener("resize", requestTimelineUpdate, { passive: true });
    requestTimelineUpdate();

    return () => {
      disposed = true;
      window.removeEventListener("scroll", requestTimelineUpdate);
      window.removeEventListener("resize", requestTimelineUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (preloadTimer) window.clearTimeout(preloadTimer);
      cache.clear();
    };
  }, [canvasRef, containerRef, onReady]);
}

export function CinematicHero({ onReady }: CinematicHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useFrameSequenceController(canvasRef, containerRef, onReady);

  return (
    <div ref={containerRef} className="cinematic-hero" data-timeline-state="intro" aria-hidden="true">
      <canvas ref={canvasRef} className="cinematic-hero-canvas" />
    </div>
  );
}
