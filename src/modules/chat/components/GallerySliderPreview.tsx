'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { searchGallery, GalleryItem } from '../services/collegeDataService';
import { GallerySlider } from './GallerySlider';

interface GallerySliderPreviewProps {
  category: string;
}

interface FlatMediaItem {
  url: string;
  itemIdx: number;
  mediaIdx: number;
  title: string;
  category: string;
}

export const GallerySliderPreview = ({ category }: GallerySliderPreviewProps) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isFullSliderOpen, setIsFullSliderOpen] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      const results = await searchGallery({ category });
      setItems(results);
      setCurrentMediaIndex(0);
      setLoading(false);
    };
    loadItems();
  }, [category]);

  const flatMedia = useMemo(() => {
    const media: FlatMediaItem[] = [];
    items.forEach((item, itemIdx) => {
      if (item.media_urls) {
        item.media_urls.forEach((url, mediaIdx) => {
          media.push({
            url,
            itemIdx,
            mediaIdx,
            title: item.title,
            category: item.category,
          });
        });
      }
    });
    return media;
  }, [items]);

  const next = () => {
    if (flatMedia.length === 0) return;
    setCurrentMediaIndex((prev) => (prev + 1) % flatMedia.length);
  };

  const prev = () => {
    if (flatMedia.length === 0) return;
    setCurrentMediaIndex((prev) => (prev - 1 + flatMedia.length) % flatMedia.length);
  };

  if (loading) {
    return (
      <div className="w-full h-40 bg-zinc-900/50 rounded-3xl border border-zinc-800 animate-pulse flex items-center justify-center">
        <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic">Fetching Album...</span>
      </div>
    );
  }

  if (flatMedia.length === 0) return null;

  const currentMedia = flatMedia[currentMediaIndex];

  return (
    <div className="mt-4 w-full">
      <div 
        onClick={() => setIsFullSliderOpen(true)}
        className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-800 group shadow-2xl cursor-pointer"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentMediaIndex}
            src={currentMedia.url}
            alt={currentMedia.title}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

        {/* Left & Right navigation buttons, permanently visible */}
        {flatMedia.length > 1 && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between z-10">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                prev(); 
              }} 
              className="p-2.5 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-full text-white active:scale-95 transition-all shadow-lg border border-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                next(); 
              }} 
              className="p-2.5 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-full text-white active:scale-95 transition-all shadow-lg border border-white/10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
          <div className="min-w-0 pr-4">
            <div className="text-[10px] text-zinc-300 font-space font-bold uppercase tracking-widest mb-1.5">
              {currentMedia.category} Album
            </div>
            <div className="text-white font-space font-bold text-sm md:text-base truncate uppercase tracking-tight">
              {currentMedia.title}
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsFullSliderOpen(true);
            }}
            className="p-2.5 bg-white/15 dark:bg-zinc-800/80 hover:bg-white/25 dark:hover:bg-zinc-700/90 text-white backdrop-blur-md border border-white/10 hover:border-white/20 transition-all rounded-xl shadow-xl active:scale-95 shrink-0 flex items-center justify-center"
          >
            <Maximize2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <GallerySlider
        items={items}
        initialIndex={currentMedia.itemIdx}
        initialMediaIndex={currentMedia.mediaIdx}
        isOpen={isFullSliderOpen}
        onClose={() => setIsFullSliderOpen(false)}
      />
    </div>
  );
};
