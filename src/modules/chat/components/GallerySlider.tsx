'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Maximize2, PlayCircle, RotateCw, RotateCcw, Minimize2, Play, Pause } from 'lucide-react';
import { GalleryItem } from '../services/collegeDataService';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';

interface GallerySliderProps {
  items: GalleryItem[];
  initialIndex?: number;
  initialMediaIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const GallerySlider = ({
  items,
  initialIndex = 0,
  initialMediaIndex = 0,
  isOpen,
  onClose
}: GallerySliderProps) => {
  const [currentEventIndex, setCurrentEventIndex] = useState(initialIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(initialMediaIndex);
  const [direction, setDirection] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<any>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useBackgroundMusic({ enabled: isOpen && isPlaying, volume: 0.10 });

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        
        // Attempt to lock orientation to landscape on mobile
        if ('orientation' in screen && 'lock' in (screen.orientation as any)) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e: any) {
            console.log("Orientation lock not supported or failed:", e);
          }
        }
      } catch (err: any) {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
      
      // Unlock orientation
      if ('orientation' in screen && 'unlock' in (screen.orientation as any)) {
        try {
          (screen.orientation as any).unlock();
        } catch (e: any) {}
      }
    }
  };

  useEffect(() => {
    const fsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fsChange);
    return () => document.removeEventListener('fullscreenchange', fsChange);
  }, []);

  useEffect(() => {
    const reset = async () => {
      setCurrentEventIndex(initialIndex);
      setCurrentMediaIndex(initialMediaIndex);
      setRotation(0);
    };
    reset();
  }, [initialIndex, initialMediaIndex, isOpen]);

  const currentItem = items[currentEventIndex];
  const mediaUrls = currentItem?.media_urls || [];

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setRotation(0);

    // Reset zoom when sliding to next image
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }

    const mediaUrls = items[currentEventIndex]?.media_urls || [];
    let nextMediaIndex = currentMediaIndex + newDirection;
    let nextEventIndex = currentEventIndex;

    // Handle overflow to next/previous event
    if (nextMediaIndex >= mediaUrls.length) {
      if (items.length > 1) {
        nextEventIndex = (currentEventIndex + 1) % items.length;
        nextMediaIndex = 0;
      } else {
        nextMediaIndex = 0; // Wrap around same event
      }
    } else if (nextMediaIndex < 0) {
      if (items.length > 1) {
        nextEventIndex = (currentEventIndex - 1 + items.length) % items.length;
        const nextEventUrls = items[nextEventIndex]?.media_urls || [];
        nextMediaIndex = Math.max(0, nextEventUrls.length - 1);
      } else {
        nextMediaIndex = Math.max(0, mediaUrls.length - 1); // Wrap around same event
      }
    }

    setCurrentEventIndex(nextEventIndex);
    setCurrentMediaIndex(nextMediaIndex);
  }, [currentEventIndex, currentMediaIndex, items]);

  // Pause autoplay on manual navigation
  const paginateAndPause = useCallback((dir: number) => {
    setIsPlaying(false);
    paginate(dir);
  }, [paginate]);

  // Autoplay timer
  useEffect(() => {
    if (isPlaying && isOpen) {
      autoplayRef.current = setInterval(() => {
        paginate(1);
      }, 3000);
    } else {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    }
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [isPlaying, isOpen, paginate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') paginateAndPause(-1);
      if (e.key === 'ArrowRight') paginateAndPause(1);
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'r') setRotation(prev => prev + 90);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paginateAndPause, onClose]);

  // Fallback if no item
  if (!currentItem) return null;

  const currentMediaUrl = mediaUrls[currentMediaIndex] || '';

  const rotate = (deg: number) => setRotation(prev => prev + deg);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          ref={containerRef}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-2xl"
        >
          {/* Progress bar for autoplay */}
          {isPlaying && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-[525] overflow-hidden">
              <motion.div
                key={`${currentEventIndex}-${currentMediaIndex}-${isPlaying}`}
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            </div>
          )}
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-[520]">
            {currentItem.type === 'image' && (
              <div className="flex gap-2 mr-1 sm:mr-2">
                <button
                  onClick={() => rotate(-90)}
                  className="p-2 sm:p-3 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-95"
                  title="Rotate Left"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 h-5" />
                </button>
                <button
                  onClick={() => rotate(90)}
                  className="p-2 sm:p-3 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-95"
                  title="Rotate Right"
                >
                  <RotateCw className="w-4 h-4 sm:w-5 h-5" />
                </button>
              </div>
            )}
            <button
              onClick={() => setIsPlaying(p => !p)}
              className={`p-2 sm:p-3 rounded-full text-white backdrop-blur-md transition-all active:scale-95 ${
                isPlaying ? 'bg-white/30 hover:bg-white/40' : 'bg-white/10 hover:bg-white/20'
              }`}
              title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all items-center justify-center active:scale-95"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md transition-all flex items-center gap-2 active:scale-95"
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Main Visual Container */}
          <div className="relative w-full h-full flex flex-col">
            {/* Nav Arrows */}
            <div className="absolute inset-y-0 left-0 w-20 z-50 flex items-center justify-center group pointer-events-none">
              <button
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                className="p-3 md:p-4 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-all pointer-events-auto active:scale-90"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 w-20 z-50 flex items-center justify-center group pointer-events-none">
              <button
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
                className="p-3 md:p-4 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-all pointer-events-auto active:scale-90"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            {/* Media Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={`${currentEventIndex}-${currentMediaIndex}`}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) paginateAndPause(1);
                    else if (swipe > swipeConfidenceThreshold) paginateAndPause(-1);
                  }}
                >
                  {currentItem.type === 'image' || currentMediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                    <TransformWrapper
                      ref={transformRef}
                      initialScale={1}
                      minScale={1}
                      maxScale={4}
                      centerOnInit
                      wheel={{ step: 0.1 }}
                      doubleClick={{ step: 1.5 }}
                      panning={{ velocityDisabled: true }}
                    >
                      <TransformComponent wrapperClass="w-full h-full flex items-center justify-center cursor-auto">
                        <motion.img
                          src={currentMediaUrl}
                          alt={currentItem.title}
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            setImageAspectRatio(img.naturalWidth / img.naturalHeight);
                          }}
                          onClick={() => {
                            // Single click zoom toggle for desktop users
                            if (window.innerWidth > 768 && transformRef.current) {
                              const { state } = transformRef.current;
                              if (state.scale > 1) {
                                transformRef.current.resetTransform();
                              } else {
                                transformRef.current.zoomIn(1.5);
                              }
                            }
                          }}
                          animate={{
                            rotate: rotation
                          }}
                          className="w-full h-full object-contain select-none mt-0 mb-4 transition-transform duration-300 cursor-zoom-in active:cursor-grabbing"
                          draggable={false}
                        />
                      </TransformComponent>
                    </TransformWrapper>
                  ) : (
                    <video
                      src={currentMediaUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain mt-0 mb-4"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Caption & Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-40">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-7xl mx-auto">
                <div className="space-y-2">
                  <p className="text-zinc-400 font-space font-bold text-xs uppercase tracking-widest">{currentItem.category} Archive</p>
                  <h3 className="text-white font-space font-bold text-xl md:text-2xl tracking-tight leading-tight">{currentItem.title}</h3>
                </div>

                {/* Media Counter */}
                <div className="flex items-center gap-3 pointer-events-auto">
                  <span className="text-white/60 text-xs font-bold font-mono px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md">
                    {currentMediaIndex + 1} / {mediaUrls.length}
                  </span>

                  {mediaUrls.length > 1 && (
                    <div className="flex gap-1.5">
                      {mediaUrls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setDirection(idx > currentMediaIndex ? 1 : -1);
                            setCurrentMediaIndex(idx);
                            setRotation(0);
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentMediaIndex ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
