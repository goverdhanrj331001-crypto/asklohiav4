'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { LayoutGrid, Image as ImageIcon, Video, ArrowLeft, Search, Filter, ChevronRight, Home } from 'lucide-react';
import { getGalleryCategories, searchGallery, GalleryItem } from '../services/collegeDataService';
import { GallerySlider } from './GallerySlider';

export const GalleryExplorer = ({ onClose, onHome, isInline }: { onClose?: () => void; onHome?: () => void; isInline?: boolean }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [sliderInitialIndex, setSliderInitialIndex] = useState(0);
  const [sliderMediaInitialIndex, setSliderMediaInitialIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const loadInit = async () => {
      setLoading(true);
      const [cats, allItems] = await Promise.all([
        getGalleryCategories(),
        searchGallery({ category: 'general' }) // load some initial items
      ]);
      setCategories(['All', ...cats]);
      setItems(allItems);
      setLoading(false);
    };
    loadInit();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || 
                             item.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleAlbumClick = (item: GalleryItem, index: number) => {
    setSelectedItem(item);
    setSliderInitialIndex(index);
  };

  const handleMediaClick = (mediaIdx: number) => {
    setSliderMediaInitialIndex(mediaIdx);
    setIsSliderOpen(true);
  };

  const handleBackToAlbums = () => {
    setSelectedItem(null);
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
  };

  if (loading && items.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-zinc-950/80 rounded-[2.5rem] border border-zinc-800/50">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] animate-pulse">Scanning Visual Archives</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative flex flex-col">
      <div className="p-0 md:p-4 flex flex-col h-full">
        <div className="flex flex-col h-full space-y-6">
          <div className="flex-shrink-0 space-y-6">
            {!isInline && (
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={selectedItem ? handleBackToAlbums : onClose}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {selectedItem ? 'Back to Albums' : 'Back'}
                  </button>
                  {onHome && (
                    <button 
                      onClick={onHome}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </button>
                  )}
                </div>
                <h1 className="font-space text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight leading-tight pt-1 md:pt-0">
                  {selectedItem ? selectedItem.title : 'Gallery Archives'}
                </h1>
              </div>
            )}

            {/* Search and Filters, only if NOT showing an album's content */}
            {!selectedItem && (
              <>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-zinc-400 dark:text-white/20" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Search in history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-6 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 transition-all font-medium text-sm shadow-sm backdrop-blur-xl"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-6 py-2 rounded-full font-space font-medium text-xs tracking-widest uppercase transition-all border ${
                        selectedCategory === cat 
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-md' 
                          : 'bg-transparent border-zinc-200 dark:border-transparent text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex-grow overflow-y-auto pr-2 scrollbar-none no-scrollbar pb-10">
            <AnimatePresence mode="wait">
              {selectedItem ? (
                <motion.div 
                  key="grid-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 pb-12"
                >
                  {selectedItem.media_urls.map((url, mediaIdx) => (
                    <motion.button
                      key={mediaIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mediaIdx * 0.03 }}
                      onClick={() => handleMediaClick(mediaIdx)}
                      className="aspect-square rounded-2xl overflow-hidden border border-white/5 shadow-lg group relative bg-zinc-800"
                    >
                      <Image 
                        src={url} 
                        alt={`${selectedItem.title} ${mediaIdx + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="album-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {filteredItems.length === 0 ? (
                    <div className="py-20 text-center opacity-50">
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No media records found</p>
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleAlbumClick(item, idx)}
                        className="w-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all text-left backdrop-blur-xl"
                      >
                        {/* Preview Images */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-white/5 relative bg-zinc-200 dark:bg-zinc-800 relative">
                          {item.media_urls && item.media_urls.length > 0 && (
                            <Image 
                              src={item.media_urls[0]} 
                              alt={item.title}
                              fill
                              sizes="80px"
                              className="object-cover transition-opacity duration-500" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {(!item.media_urls || item.media_urls.length === 0) && item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Video className="w-5 h-5 text-white shadow-sm" />
                            </div>
                          )}
                          {item.media_urls && item.media_urls.length > 1 && (
                            <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-black text-white">
                              +{item.media_urls.length - 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-white/40 font-space font-bold">{item.category}</span>
                          </div>
                          <h3 className="font-space font-bold text-zinc-900 dark:text-white text-lg truncate tracking-tight mb-1">{item.title}</h3>
                          <div className="text-zinc-600 dark:text-white/50 text-[13px] font-space flex items-center gap-2">
                             {item.type === 'image' ? (
                                <ImageIcon className="w-3 h-3 opacity-50" />
                             ) : (
                                <Video className="w-3 h-3 opacity-50" />
                             )}
                             <span>{item.type === 'image' ? (item.media_urls.length > 1 ? `${item.media_urls.length} Photographs` : 'Photograph') : 'Video Footage'}</span>
                             <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-white/20"></span>
                             <span>{item.event_date ? new Date(item.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Official Record'}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-white/30 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors" />
                      </motion.button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <GallerySlider
        items={filteredItems}
        initialIndex={sliderInitialIndex}
        initialMediaIndex={sliderMediaInitialIndex}
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
      />
    </div>
  );
};
