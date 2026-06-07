'use client';

import React, { useState, useRef } from 'react';
import { Plus, Mic, AudioLines, Send, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInputProps {
  onSend: (message: string, image?: File) => void;
  isLoading: boolean;
  onLiveClick?: () => void;
  onStop?: () => void;
}

export const ChatInput = ({ onSend, isLoading, onLiveClick, onStop }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messageTimestampsRef = useRef<number[]>([]); // Track timestamps for rate limit
  const MAX_WORDS = 100;
  const MAX_MESSAGES_PER_MINUTE = 20;
  const ONE_MINUTE_MS = 60000;

  // Helper to count words (trim, split on whitespace, count non-empty)
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper to check rate limit
  const isRateLimited = () => {
    const now = Date.now();
    // Filter out timestamps older than one minute
    messageTimestampsRef.current = messageTimestampsRef.current.filter(
      (ts) => now - ts < ONE_MINUTE_MS
    );
    return messageTimestampsRef.current.length >= MAX_MESSAGES_PER_MINUTE;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isRateLimited()) {
      alert(`Rate limit reached: max ${MAX_MESSAGES_PER_MINUTE} messages per minute!`);
      return;
    }
    const wordCount = countWords(value);
    if (wordCount > MAX_WORDS) {
      alert(`Max ${MAX_WORDS} words allowed! You have ${wordCount} words.`);
      return;
    }
    if ((value.trim() || selectedFile) && !isLoading) {
      onSend(value, selectedFile || undefined);
      messageTimestampsRef.current.push(Date.now());
      setValue('');
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi preference
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setValue(transcript);
      // Bizli Speed: Auto-send if it's a short command
      if (transcript.split(' ').length < 5 && (transcript.toLowerCase().includes('principal') || transcript.toLowerCase().includes('faculty'))) {
        onSend(transcript);
        setValue('');
      }
    };
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="w-full transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-4 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between shadow-2xl relative"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <ImageIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-black dark:text-white font-bold text-xs truncate max-w-[200px]">{selectedFile.name}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase font-black">Image ready for extraction</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Remove File"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-full p-1.5 shadow-2xl focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all pl-6"
        >
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <input
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              if (countWords(newValue) <= MAX_WORDS) {
                setValue(newValue);
              }
            }}
            disabled={isLoading || isListening}
            placeholder={isListening ? "Listening..." : "Ask anything"}
            className="flex-grow bg-transparent text-black dark:text-white py-3 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-lg w-full min-w-0"
          />

          <div className="flex items-center gap-3 shrink-0 p-1">
            <span className={`text-[10px] font-bold uppercase tracking-wide ${countWords(value) >= MAX_WORDS - 10 ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}>
              {countWords(value)}/{MAX_WORDS}
            </span>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.button
                  key="stop"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={onStop}
                  className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                     <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-[2px]" />
                  </div>
                </motion.button>
              ) : (value.trim() || selectedFile) && !isListening ? (
                <motion.button
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="submit"
                  className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              ) : (
                <div key="actions" className="flex items-center gap-1">
                  <motion.button
                    type="button"
                    onClick={startListening}
                    className={`p-3 transition-colors ${isListening ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
                  >
                    <Mic className="w-6 h-6" />
                  </motion.button>
                  <button
                    type="button"
                    onClick={onLiveClick}
                    className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center w-10 h-10 shrink-0"
                  >
                    <AudioLines className="w-5 h-5" />
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  );
};
