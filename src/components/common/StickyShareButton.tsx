'use client';

import React, { useState, useEffect } from 'react';
import { Share2, X, Link2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StickyShareButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [shareUrl, setShareUrl] = useState('https://lohia-college.ai');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShareUrl(currentUrl);
    }
  }, []);

  const shareText = `*Lohia College AI Assistant* 🎓✨\n\nGet instant answers to all your Lohia College questions: Exam Schedules, Results, Admission Details, Faculty Info, and Toppers list! Ask in Hindi or English.\n\n👉 Try it now: ${shareUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShowToast(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);

      // Open Instagram in a new tab so they can paste it
      setTimeout(() => {
        window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
      }, 1200);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Share Group */}
      <div className="fixed right-4 bottom-32 sm:bottom-24 lg:right-6 lg:bottom-28 z-[60] flex flex-col items-center select-none">
        
        {/* Expanded Options */}
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-center gap-3 mb-3">
              
              {/* WhatsApp Button */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative group"
              >
                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Share on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </button>
                {/* Tooltip */}
                <div className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-zinc-700/50">
                  Share on WhatsApp
                </div>
              </motion.div>

              {/* Instagram Button */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
                className="relative group"
              >
                <button
                  onClick={handleInstagramShare}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-lg hover:shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Share on Instagram"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </button>
                {/* Tooltip */}
                <div className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-zinc-700/50">
                  {copied ? 'Link Copied!' : 'Share on Instagram'}
                </div>
              </motion.div>

              {/* Google Form Button */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
                className="relative group"
              >
                <button
                  onClick={() => {
                    window.open('https://docs.google.com/forms/d/e/1FAIpQLScz_8F2WAZxdREOrA7TSqhRPEBvSv92K4_0WN6VGgr7zaWvWg/viewform?usp=dialog', '_blank', 'noopener,noreferrer');
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-[#4285F4] text-white shadow-lg hover:shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Open Google Form"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM13 9V3.5L18.5 9H13zM6 4h5v8l-2.5-1.5L6 12V4zm0 16v-4h5.5l2.5 1.5L18 20H6z"/>
                  </svg>
                </button>
                {/* Tooltip */}
                <div className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-zinc-700/50">
                  Open Google Form
                </div>
              </motion.div>

            </div>
          )}
        </AnimatePresence>

        {/* Main Sticky Share Toggle Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 cursor-pointer ${
            isOpen 
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95' 
              : 'bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 hover:scale-110 active:scale-95 hover:shadow-zinc-400/20 dark:hover:shadow-black/40'
          }`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle share options"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>

      {/* Beautiful Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-full bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-900 shadow-2xl backdrop-blur-sm border border-zinc-800 dark:border-zinc-200"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold font-sans tracking-wide">
              Link copied! Paste it in your Instagram story or DM 🚀
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
