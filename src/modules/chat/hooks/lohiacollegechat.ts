'use client';

import { useState, useCallback, useRef } from 'react';
import { generateChatResponseStream, Message } from '../services/lohiacollegeai';
import { useStudentProfile } from '@/modules/profile/hooks/useStudentProfile';

export function useLohiaCollegeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useStudentProfile();
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopMessage = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, image?: File) => {
    if (!content.trim() && !image) return;

    if (isLoading) return; // Prevent multiple requests.

    const userMessage: Message = { role: 'user', content, image };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const stream = generateChatResponseStream(messages, content, image, profile || undefined, abortController.signal);
      
      let fullResponse = "";
      const modelMessage: Message = { role: 'model', content: "" };
      setMessages(prev => [...prev, modelMessage]);

      for await (const chunk of stream) {
        if (abortController.signal.aborted) {
          break;
        }

        if (chunk.provider && !modelMessage.provider) {
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], provider: chunk.provider };
            return next;
          });
        }

        if (chunk.text) {
          fullResponse += chunk.text;
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === 'model') {
              next[next.length - 1] = { ...last, content: fullResponse };
            }
            return next;
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
         console.log('Stream aborted');
      } else {
        setError(err.message || 'Something went wrong');
        console.error(err);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [messages, isLoading, profile]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopMessage,
    clearChat,
  };
}
