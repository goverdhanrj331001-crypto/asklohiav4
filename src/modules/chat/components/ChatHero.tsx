'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, Library, BookOpen, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

const ACTION_ITEMS = [
  { icon: BookOpen, label: 'Exams', color: 'text-purple-400' },
  { icon: Users, label: 'Faculty', color: 'text-blue-400' },
  { icon: Calendar, label: 'Events', color: 'text-orange-400' },
  { icon: Library, label: 'Gallery', color: 'text-emerald-400' },
  { icon: Trophy, label: 'Toppers', color: 'text-yellow-400' },
];

interface ChatHeroProps {
  onAction: (label: string) => void;
}

export const ChatHero = ({ onAction }: ChatHeroProps) => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const fullText = "I am the Assistant AI for Lohia College. How can I help you?";

  useEffect(() => {
    let timeout = isDeleting ? 20 : 50;

    if (!isDeleting && text === fullText) {
      timeout = 3000;
    } else if (isDeleting && text === '') {
      timeout = 500;
    }

    const timer = setTimeout(() => {
      if (!isDeleting && text === fullText) {
        setIsDeleting(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
      } else {
        setText(fullText.substring(0, text.length + (isDeleting ? -1 : 1)));
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [text, isDeleting]);

  return (
    <div className="flex flex-col items-start justify-center px-6 pt-16 md:pt-12 pb-8 max-w-2xl mx-auto w-full flex-grow">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >

        <h2 className="text-3xl md:text-5xl font-medium text-zinc-700 dark:text-zinc-300 mb-6 md:mb-8 leading-tight drop-shadow-sm min-h-[120px] sm:min-h-[100px] md:min-h-[150px]">
          {text}
          <span className="animate-pulse font-light text-zinc-400 dark:text-zinc-500">|</span>
        </h2>
      </motion.div>

      <div className="space-y-3 w-full">
        {ACTION_ITEMS.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            onClick={() => onAction(item.label)}
            className="flex items-center gap-4 w-full p-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-[1.5rem] hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-[1.25rem] flex items-center justify-center border border-zinc-200 dark:border-zinc-700/30 group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors shadow-sm">
              <item.icon className="w-6 h-6 text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
            </div>
            <span className="text-xl font-bold text-zinc-800 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors tracking-tight">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
