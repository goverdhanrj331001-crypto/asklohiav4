'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { LayoutGrid, Maximize2 } from 'lucide-react';
import { searchGallery, GalleryItem } from '../services/collegeDataService';
import { GallerySlider } from './GallerySlider';
import { GalleryExplorer } from './GalleryExplorer';

interface GalleryGridPreviewProps {
  query: string;
}

export const GalleryGridPreview = ({ query }: GalleryGridPreviewProps) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullSliderOpen, setIsFullSliderOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      let results = await searchGallery({ query });
      if (results.length === 0 && query.trim().toLowerCase() !== 'latest program') {
        results = await searchGallery({ query: 'latest program' });
      }
      setItems(results);
      setLoading(false);
    };
    loadItems();
  }, [query]);

  if (loading) {
    return (
      <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse ${i === 1 ? 'aspect-video col-span-2' : 'aspect-square'}`} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-4 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-5 text-sm font-medium text-white/80">
        Is programme ki photos abhi yahan nahi mili. Gallery me latest albums check kar sakte hain.
      </div>
    );
  }

  // Extract up to 5 unique images from the items
  const allMedia: { url: string; itemIdx: number; mediaIdx: number; title: string }[] = [];
  items.forEach((item, itemIdx) => {
    item.media_urls.forEach((url, mediaIdx) => {
      if (allMedia.length < 5) {
        allMedia.push({ url, itemIdx, mediaIdx, title: item.title });
      }
    });
  });

  if (allMedia.length === 0) {
    return (
      <div className="mt-4 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-5 text-sm font-medium text-white/80">
        Matching album mila, lekin usme displayable photos abhi attach nahi hain.
      </div>
    );
  }

  const handleImageClick = (idx: number) => {
    setSelectedIndex(allMedia[idx].itemIdx);
    setSelectedMediaIndex(allMedia[idx].mediaIdx);
    setIsFullSliderOpen(true);
  };

  return (
    <div className="mt-4 w-full">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-xl">
        <div className="grid grid-cols-3 auto-rows-[120px] sm:auto-rows-[150px] md:auto-rows-[180px] gap-0.5 p-0.5">
        {allMedia.map((media, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative group overflow-hidden cursor-pointer bg-zinc-900 ${
              idx === 0 ? 'col-span-2 row-span-2' : ''
            }`}
            onClick={() => handleImageClick(idx)}
          >
            <Image 
              src={media.url} 
              alt={media.title}
              fill
              referrerPolicy="no-referrer"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Maximize2 className="text-white w-4 h-4" />
              </div>
            </div>
            {idx === 0 && (
              <div className="absolute bottom-2 left-2 max-w-[85%] bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full text-[8px] text-white font-bold uppercase tracking-wider truncate">
                {media.title}
              </div>
            )}
          </motion.div>
        ))}
        </div>

        <button
          onClick={() => setIsExplorerOpen(true)}
          className="absolute right-3 bottom-3 flex items-center gap-2 rounded-full bg-black/65 hover:bg-black/80 text-white px-3 py-2 backdrop-blur-md border border-white/15 shadow-lg transition-all active:scale-95"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">See All</span>
        </button>
      </div>

      <GallerySlider
        items={items}
        initialIndex={selectedIndex}
        initialMediaIndex={selectedMediaIndex}
        isOpen={isFullSliderOpen}
        onClose={() => setIsFullSliderOpen(false)}
      />

      <AnimatePresence>
        {isExplorerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[150] bg-white dark:bg-black p-4 md:p-8"
          >
            <GalleryExplorer onClose={() => setIsExplorerOpen(false)} isInline={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
