'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Calendar, ArrowLeft, Clock, MapPin, Search, ChevronRight, Filter, Home } from 'lucide-react';
import { searchEvents, CollegeEvent } from '../services/collegeDataService';

export const EventExplorer = ({ initialQuery = '', onClose, onHome, isInline }: { initialQuery?: string; onClose?: () => void; onHome?: () => void; isInline?: boolean }) => {
  const [view, setView] = useState<'list' | 'profile'>('list');
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CollegeEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Events');

  const categories = ['All Events', 'Seminar', 'Cultural', 'Technical', 'Sports'];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const results = await searchEvents({ query: initialQuery });
      setEvents(results);
      
      if (results.length === 1 && initialQuery) {
        setSelectedEvent(results[0]);
        setView('profile');
      }
      setLoading(false);
    };
    loadData();
  }, [initialQuery]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const isInitialQuery = searchQuery === initialQuery && initialQuery.trim() !== '';
      const cleanSearchQuery = searchQuery.trim().toLowerCase();
      const matchesSearch = isInitialQuery || cleanSearchQuery === '' || 
                           event.title.toLowerCase().includes(cleanSearchQuery) || 
                           event.description.toLowerCase().includes(cleanSearchQuery);
      const matchesCategory = selectedCategory === 'All Events' || 
                             event.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory, initialQuery]);

  const handleEventClick = (event: CollegeEvent) => {
    setSelectedEvent(event);
    setView('profile');
  };

  const goBack = () => {
    if (view === 'profile') {
      setView('list');
      setSelectedEvent(null);
    } else if (onClose) {
      onClose();
    }
  };

  const displayTitle = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (q.includes('past') || q.includes('purane') || q.includes('ho gaye')) return 'Past Events History';
    if (q.includes('upcoming') || q.includes('aage') || q.includes('hone wale') || q.includes('future')) return 'Upcoming Discoveries';
    const yearMatch = q.match(/\b(20\d{2})\b/);
    if (yearMatch) return `Events in ${yearMatch[0]}`;
    return 'College Events';
  }, [searchQuery]);

  if (loading && view === 'list') {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-zinc-950/80 rounded-[2.5rem] border border-zinc-800/50">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-rose-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] animate-pulse">Synchronizing Records</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative flex flex-col">
      <div className="p-0 md:p-4 flex flex-col h-full">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full space-y-6"
            >
              <div className="flex-shrink-0 space-y-6">
                {!isInline && (
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={goBack}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
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
                    <h1 className="font-space text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight leading-tight pt-1 md:pt-0 drop-shadow-sm">
                      {displayTitle}
                    </h1>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-white/20" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Find your next discovery..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-6 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 transition-all font-medium text-sm shadow-sm backdrop-blur-xl"
                  />
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-6 py-2 rounded-full font-space font-medium text-xs tracking-widest uppercase transition-all border ${
                        selectedCategory === cat 
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-md' 
                          : 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-white/60 hover:bg-white dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white shadow-sm'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events List */}
              <div className="flex-grow overflow-y-auto pr-2 scrollbar-none no-scrollbar pb-6 space-y-4">
                {filteredEvents.length === 0 ? (
                  <div className="py-20 text-center opacity-50">
                    <p className="text-white font-bold uppercase tracking-widest text-xs">No events found matching your filter</p>
                  </div>
                ) : (
                  filteredEvents.map((event, idx) => (
                    <motion.button
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleEventClick(event)}
                  className="w-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 mb-3 flex items-center gap-4 cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all text-left backdrop-blur-xl"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-white/5 shadow-sm relative">
                    <Image 
                      alt={event.title} 
                      fill
                      className="object-cover transition-all duration-500" 
                      src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=200&h=200&auto=format&fit=crop'}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-white/40 font-space font-bold">{event.category || 'EVENT'}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-white/40 font-space">{event.time || '07:00 AM'}</span>
                    </div>
                    <h3 className="font-space font-bold text-zinc-900 dark:text-white text-xl truncate tracking-tight mb-1">{event.title}</h3>
                    <div className="text-zinc-600 dark:text-white/50 text-[13px] font-space flex items-center gap-2">
                      <span>{new Date(event.date || '2026-06-08').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-white/20"></span>
                      <span>Main Auditorium</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-white/30 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors" />
                </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="profile-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-20"
            >
              {selectedEvent && (
                <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4 md:mb-8">
                    {(!isInline || events.length > 1) && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={goBack}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </button>
                        {onHome && (
                          <button 
                            onClick={onHome}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                            title="Home"
                          >
                            <Home className="w-4 h-4" />
                            Home
                          </button>
                        )}
                      </div>
                    )}
                    {(!isInline || events.length > 1) && (
                      <h2 className="text-lg sm:text-xl md:text-2xl font-space font-bold text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight pt-1 md:pt-0">
                        Event Record
                      </h2>
                    )}
                  </div>

                  <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative">
                    <Image 
                      src={selectedEvent.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop'} 
                      alt={selectedEvent.title}
                      fill
                      priority
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <div className="absolute bottom-6 left-8 right-8">
                       <span className="px-3 py-1 bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-3 inline-block shadow-lg">
                        {selectedEvent.category || 'Special Event'}
                       </span>
                       <h2 className="text-3xl md:text-5xl font-space font-bold text-white uppercase tracking-tighter leading-[0.9]">
                        {selectedEvent.title}
                       </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-6 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200 dark:border-white/10">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-white/40 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Log Date</span>
                      </div>
                      <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                        {new Date(selectedEvent.date || '').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="p-6 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200 dark:border-white/10">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-white/40 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Time</span>
                      </div>
                      <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                        {selectedEvent.time || 'Schedule TBA'}
                      </p>
                    </div>

                    <div className="p-6 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200 dark:border-white/10">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-white/40 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Location</span>
                      </div>
                      <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                        College Campus Grounds
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-white/30 mb-4 flex items-center gap-2">
                      <div className="w-8 h-[1px] bg-zinc-300 dark:bg-white/10"></div> Historical Brief & Overview
                    </h4>
                    <p className="text-zinc-700 dark:text-white/60 font-medium leading-relaxed text-base md:text-lg">
                      {selectedEvent.description || 'No detailed description available for this official event record.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
