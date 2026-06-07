'use client';

import React from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface FounderCardProps {
  name: string;
  imageUrl: string;
  description?: string;
}

export const FounderCard = ({ name, imageUrl }: FounderCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 w-full max-w-[320px] mx-auto group"
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-2 border-zinc-800/50">
        <Image 
          src={imageUrl || '/founder.png'} 
          alt={name}
          fill
          priority
          referrerPolicy="no-referrer"
          className="object-cover object-top transition-transform duration-1000 group-hover:scale-105" 
        />
      </div>
    </motion.div>
  );
};
