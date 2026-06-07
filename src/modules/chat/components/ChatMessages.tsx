'use client';

import React, { useRef, useEffect } from 'react';
import { Message } from '../services/lohiacollegeai';
import { motion } from 'motion/react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { InteractiveForm } from './InteractiveForm';
import { PrincipalCard } from './PrincipalCard';
import { FacultyExplorer } from './FacultyExplorer';
import { EventExplorer } from './EventExplorer';
import { GallerySliderPreview } from './GallerySliderPreview';
import { GalleryGridPreview } from './GalleryGridPreview';
import { GalleryExplorer } from './GalleryExplorer';
import { ExamExplorer } from './ExamExplorer';
import { ToppersExplorer } from './ToppersExplorer';
import { FounderCard } from './FounderCard';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onButtonClick: (text: string) => void;
}

const MessageItem = React.memo(({ message, isLast, onButtonClick }: { message: Message; isLast: boolean; onButtonClick: (text: string) => void; }) => {
  const renderContent = (content: string | null) => {
    if (!content && !message.image) return null;

    if (content) {
      // Robustly handle AI putting HTML in code blocks
      const cleanedContent = content.replace(/```html\n?([\s\S]*?)```/g, '$1')
        .replace(/```\n?([\s\S]*?)```/g, (match, p1) => {
          if (p1.trim().startsWith('<div')) return p1;
          return match;
        });

      const examMatch = cleanedContent.match(/\[\[EXAM_FORM(?::([^\]]+))?\]\]/);
      const resourceMatch = cleanedContent.match(/\[\[RESOURCE_FORM(?::([^\]]+))?\]\]/);
      const principalMatch = cleanedContent.match(/\[\[PRINCIPAL_CARD:(.*?):(.*?)\]\]/);
      const facultyExplorerMatch = cleanedContent.match(/\[\[FACULTY_EXPLORER(:(.*?))?\]\]/);
      const facultyListMatch = cleanedContent.match(/\[\[FACULTY_LIST:(.*?)\]\]/);
      const eventExplorerMatch = cleanedContent.match(/\[\[EVENT_EXPLORER(:(.*?))?\]\]/);
      const examExplorerMatch = cleanedContent.match(/\[\[EXAM_EXPLORER(?::([^\]]+))?\]\]/);
      const examResultsMatch = cleanedContent.match(/\[\[EXAM_RESULTS:(.*?):(.*?):(.*?):(.*?)(:(.*?))?\]\]/);
      const gallerySliderMatch = cleanedContent.match(/\[\[GALLERY_SLIDER:\s*(.*?)\s*\]\]/);
      const galleryGridMatch = cleanedContent.match(/\[\[GALLERY_GRID:\s*(.*?)\s*\]\]/);
      const galleryExplorerMatch = cleanedContent.includes('[[GALLERY_EXPLORER]]');
      const toppersExplorerMatch = cleanedContent.match(/\[\[TOPPERS_EXPLORER(:(.*?))?\]\]/);
      const founderMatch = cleanedContent.match(/\[\[FOUNDER_CARD:(.*?):(.*?)\]\]/);

      // STREAMING UI Logic
      const isStreamingExam = cleanedContent.includes('[[EXAM_FORM') && !examMatch;
      const isStreamingResource = cleanedContent.includes('[[RESOURCE_FORM') && !resourceMatch;
      const isStreamingPrincipal = cleanedContent.includes('[[PRINCIPAL_CARD') && !principalMatch;
      const isStreamingFaculty = cleanedContent.includes('[[FACULTY_EXPLORER') && !facultyExplorerMatch;
      const isStreamingEvent = cleanedContent.includes('[[EVENT_EXPLORER') && !eventExplorerMatch;
      const isStreamingExamExplorer = cleanedContent.includes('[[EXAM_EXPLORER') && !examExplorerMatch;
      const isStreamingExamResults = cleanedContent.includes('[[EXAM_RESULTS') && !examResultsMatch;
      const isStreamingGallerySlider = cleanedContent.includes('[[GALLERY_SLIDER') && !gallerySliderMatch;
      const isStreamingGalleryGrid = cleanedContent.includes('[[GALLERY_GRID') && !galleryGridMatch;
      const isStreamingGalleryExplorer = cleanedContent.includes('[[GALLERY_EXPLORER') && !galleryExplorerMatch;
      const isStreamingToppers = cleanedContent.includes('[[TOPPERS_EXPLORER') && !toppersExplorerMatch;

      let formComponent = null;
      let textContent = cleanedContent;

      if (examMatch) {
        let initialSubject = '';
        let initialStatus = undefined;
        let initialLevel = undefined;
        let initialSemester = undefined;
        if (examMatch[1]) {
          const parts = examMatch[1].split(':');
          initialSubject = parts[0] === 'null' || !parts[0] ? '' : parts[0];
          initialStatus = parts[1] || undefined;
          initialLevel = parts[2] || undefined;
          initialSemester = parts[3] || undefined;
        }
        formComponent = <InteractiveForm type="exam" initialSubject={initialSubject} initialStatus={initialStatus} initialLevel={initialLevel} initialSemester={initialSemester} onSearch={onButtonClick} />;
        textContent = cleanedContent.replace(examMatch[0], '');
      } else if (resourceMatch) {
        let initialSubject = '';
        let initialStatus = undefined;
        let initialLevel = undefined;
        let initialSemester = undefined;
        if (resourceMatch[1]) {
          const parts = resourceMatch[1].split(':');
          initialSubject = parts[0] === 'null' || !parts[0] ? '' : parts[0];
          initialStatus = parts[1] || undefined;
          initialLevel = parts[2] || undefined;
          initialSemester = parts[3] || undefined;
        }
        formComponent = <InteractiveForm type="resource" initialSubject={initialSubject} initialStatus={initialStatus} initialLevel={initialLevel} initialSemester={initialSemester} onSearch={onButtonClick} />;
        textContent = cleanedContent.replace(resourceMatch[0], '');
      } else if (principalMatch) {
        formComponent = <PrincipalCard name={principalMatch[1]} imageUrl={principalMatch[2]} />;
        textContent = cleanedContent.replace(principalMatch[0], '');
      } else if (facultyExplorerMatch) {
        formComponent = <FacultyExplorer initialTeacherName={facultyExplorerMatch[2] || undefined} isInline={true} />;
        textContent = cleanedContent.replace(facultyExplorerMatch[0], '');
      } else if (facultyListMatch) {
        formComponent = <FacultyExplorer initialDepartment={facultyListMatch[1]} isInline={true} />;
        textContent = cleanedContent.replace(facultyListMatch[1] ? facultyListMatch[0] : '[[FACULTY_LIST:]]', '');
      } else if (eventExplorerMatch) {
        formComponent = <EventExplorer initialQuery={eventExplorerMatch[2] || ''} isInline={true} />;
        textContent = cleanedContent.replace(eventExplorerMatch[0], '');
      } else if (examExplorerMatch) {
        let initialSelections = undefined;
        if (examExplorerMatch[1]) {
          const parts = examExplorerMatch[1].split(':');
          initialSelections = {
            department: parts[0] || undefined,
            status: parts[1] || undefined,
            level: parts[2] || undefined,
            semester: parts[3] ? parseInt(parts[3]) : undefined
          };
        }
        formComponent = <ExamExplorer isInline={true} initialSelections={initialSelections} />;
        textContent = cleanedContent.replace(examExplorerMatch[0], '');
      } else if (examResultsMatch) {
        formComponent = (
          <ExamExplorer
            isInline={true}
            initialSelections={{
              department: examResultsMatch[1],
              status: examResultsMatch[2],
              level: examResultsMatch[3],
              semester: parseInt(examResultsMatch[4]),
              examType: examResultsMatch[6] || 'Main Exam'
            }}
          />
        );
        textContent = cleanedContent.replace(examResultsMatch[0], '');
      } else if (galleryGridMatch) {
        formComponent = <GalleryGridPreview query={galleryGridMatch[1]} />;
        textContent = cleanedContent.replace(galleryGridMatch[0], '');
      } else if (gallerySliderMatch) {
        formComponent = <GallerySliderPreview category={gallerySliderMatch[1]} />;
        textContent = cleanedContent.replace(gallerySliderMatch[0], '');
      } else if (galleryExplorerMatch) {
        formComponent = <GalleryExplorer isInline={true} />;
        textContent = cleanedContent.replace('[[GALLERY_EXPLORER]]', '');
      } else if (toppersExplorerMatch) {
        let initialBoard = undefined;
        let initialSearchQuery = undefined;
        if (toppersExplorerMatch[2]) {
          const rawParam = toppersExplorerMatch[2].trim();
          if (rawParam.includes(':')) {
            const parts = rawParam.split(':');
            initialBoard = parts[0] ? parts[0].trim() : undefined;
            initialSearchQuery = parts[1] ? parts[1].trim() : undefined;
          } else {
            // Check if it's a 4-digit year, if so it's a search query, not a board
            if (rawParam.match(/^\b(19\d{2}|20\d{2})\b$/)) {
              initialSearchQuery = rawParam;
            } else {
              initialBoard = rawParam;
            }
          }
        }
        formComponent = <ToppersExplorer initialBoard={initialBoard} initialSearchQuery={initialSearchQuery} isInline={true} />;
        textContent = cleanedContent.replace(toppersExplorerMatch[0], '');
      } else if (founderMatch) {
        formComponent = <FounderCard name={founderMatch[1]} imageUrl={founderMatch[2]} />;
        textContent = cleanedContent.replace(founderMatch[0], '');
      } else if (isStreamingExam || isStreamingResource || isStreamingPrincipal || isStreamingFaculty || isStreamingEvent || isStreamingExamExplorer || isStreamingGallerySlider || isStreamingGalleryGrid || isStreamingGalleryExplorer || isStreamingToppers) {
        formComponent = (
          <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl animate-pulse flex items-center justify-center">
            <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-widest">Generating UI...</div>
          </div>
        );
        textContent = cleanedContent.split('[[')[0];
      }

      const hasSpecialContent = examMatch || resourceMatch || principalMatch;

      return (
        <div className="space-y-4">
          {message.image && (
            <div className="relative w-full max-w-sm aspect-[4/3] rounded-[2.5rem] overflow-hidden border-4 border-zinc-800 shadow-[0_20px_40px_rgba(0,0,0,0.4)] group/img">
              <Image
                src={URL.createObjectURL(message.image)}
                alt="Uploaded Document"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-black uppercase tracking-widest border border-white/20">
                Scanned Document
              </div>
            </div>
          )}
          {formComponent && <div className="not-prose w-full">{formComponent}</div>}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              table: ({ ...props }) => (
                <div className="markdown-table-scroll">
                  <table {...props} />
                </div>
              )
            }}
          >
            {textContent}
          </ReactMarkdown>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col group ${message.role === 'user' ? 'items-end' : 'items-start'
        } ${!isLast ? 'old-message' : ''}`}
    >
      <div
        className={`${message.role === 'user' ? 'max-w-[90%]' : 'max-w-full'} md:max-w-[95%] rounded-2xl px-4 py-3 relative ${message.role === 'user'
          ? 'bg-zinc-100 dark:bg-zinc-700 text-black dark:text-white rounded-tr-none shadow-md'
          : 'bg-transparent text-zinc-900 dark:text-white border-none px-0 w-full'
          }`}
      >
        {/* Style to hide interactive parts in old messages */}
        {!isLast && (
          <style>{`
            .old-message .interactive-step { 
              display: none !important; 
            }
          `}</style>
        )}
        {message.role !== 'user' && message.provider && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-zinc-200 dark:border-white relative">
              <Image
                src="/lohia-logo.webp"
                alt="Logo"
                fill
                sizes="20px"
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
              LOHIA COLLEGE AI
            </span>
          </div>
        )}
        <div className="markdown-content prose dark:prose-invert prose-p:text-black dark:prose-p:text-white prose-headings:text-black dark:prose-headings:text-white prose-strong:text-black dark:prose-strong:text-white prose-li:text-black dark:prose-li:text-white max-w-none prose-p:leading-relaxed prose-img:rounded-[2.5rem] prose-img:mt-6 prose-img:mb-4 prose-img:w-full prose-img:aspect-square prose-img:object-cover prose-img:border-4 prose-img:border-zinc-200 dark:prose-img:border-zinc-800 pb-2">
          {renderContent(message.content)}
        </div>
      </div>
    </motion.div>
  );
});

MessageItem.displayName = 'MessageItem';

export const ChatMessages = ({ messages, isLoading, onButtonClick }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest('[data-chat-query]') as HTMLElement;
    if (button) {
      const query = button.getAttribute('data-chat-query');
      if (query) {
        onButtonClick(query);
      }
    }
  };

  if (messages.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-8 px-6 py-12 pb-40 max-w-4xl mx-auto w-full relative"
      onClick={handleContainerClick}
    >
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} isLast={index === messages.length - 1} onButtonClick={onButtonClick} />
      ))}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800/50"
        >
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-blue-500/40 rounded-full" />
            <div className="w-2 h-2 bg-blue-500/40 rounded-full" />
            <div className="w-2 h-2 bg-blue-500/40 rounded-full" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Thinkin...</span>
        </motion.div>
      )}
      <div ref={messagesEndRef} className="h-4 w-full flex-shrink-0" />
    </div>
  );
};
