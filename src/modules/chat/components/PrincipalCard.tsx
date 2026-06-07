'use client';

import React from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface PrincipalCardProps {
  name: string;
  imageUrl: string;
}

export const PrincipalCard = ({ name, imageUrl }: PrincipalCardProps) => {
  const fallbackImg = 'https://images.unsplash.com/photo-1544717297-fa95b3ee51f3?q=80&w=1200&auto=format&fit=crop';
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 w-full max-w-[200px] mx-auto group"
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-2 border-zinc-800/50">
        <Image 
          src={imageUrl && imageUrl.startsWith('http') ? imageUrl : fallbackImg} 
          alt={name}
          fill
          referrerPolicy="no-referrer"
          className="object-cover object-top transition-transform duration-1000 group-hover:scale-105" 
        />
      </div>
    </motion.div>
  );
};
