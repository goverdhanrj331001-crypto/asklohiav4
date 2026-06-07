import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { StylesSafelist } from '@/modules/chat/components/StylesSafelist';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
});

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://asklohia.online'),
  title: {
    default: 'Lohia College AI | Official Assistant Churu',
    template: '%s | Lohia College AI'
  },
  description: 'Official AI Assistant for Lohia College, Churu. Get instant help with exam schedules, results, faculty information, and admission details.',
  keywords: ['Lohia College', 'Lohia College Churu', 'Lohia AI', 'Lohia College Assistant', 'Churu College', 'Lohia College Exam Results', 'Lohia College Admission'],
  authors: [{ name: 'Lohia College AI Team' }],
  creator: 'Lohia College AI',
  publisher: 'Lohia College, Churu',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lohia College AI',
  },
  icons: {
    icon: '/lohia-logo.webp',
    apple: '/lohia-logo.webp',
    shortcut: '/lohia-logo.webp',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://lohia-college.ai', // Placeholder, user will replace with actual domain
    siteName: 'Lohia College AI Assistant',
    title: 'Lohia College AI | The Smart Way to College',
    description: 'Get all your Lohia College info instantly: Exams, Results, Faculty, and more.',
    images: [
      {
        url: '/lohia-logo.webp',
        width: 1200,
        height: 630,
        alt: 'Lohia College AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lohia College AI Assistant',
    description: 'Instant info for Lohia College students.',
    images: ['/lohia-logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { PWARegistration } from '@/components/common/PWARegistration';
import { StickyShareButton } from '@/components/common/StickyShareButton';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){var _t=[[/openrouter/gi,'lohia-ai-engine'],[/gemini/gi,'lohia-ai'],[/vertex[\\s\\-]?ai/gi,'lohia-ai-core'],[/vertex/gi,'lohia-core'],[/supabase/gi,'lohia-db'],[/gotrue/gi,'lohia-auth'],[/@google\\/genai/gi,'lohia-sdk'],[/google\\.genai/gi,'lohia-sdk'],[/NEXT_PUBLIC_/gi,'LC_'],[/hfcnnznczylg[a-z0-9]*/gi,'lc-data'],[/collegechatbot[\\-0-9]*/gi,'lc-project'],[/openai\\/gpt/gi,'lohia-model'],[/\\[Proxy\\]/gi,'[LC-Voice]'],[/\\[LiveAPI\\]/gi,'[LC-Voice]'],[/\\[Server\\]/gi,'[LC-System]'],[/\\[Auth\\]/gi,'[LC-Auth]']];function _s(a){return a.map(function(x){if(typeof x!=='string')return x;_t.forEach(function(p){x=x.replace(p[0],p[1]);});return x;});}var _sup=['bis_skin_checked','bis_use','hydrat','Hydrat','@supabase/gotrue-js','Lock'];var _o={log:console.log,warn:console.warn,error:console.error,info:console.info};function _f(orig){return function(){var args=[].slice.call(arguments);var msg=args.map(function(a){return typeof a==='string'?a:'';}).join(' ');if(_sup.some(function(s){return msg.includes(s);}))return;orig.apply(console,_s(args));};}console.error=_f(_o.error);console.warn=_f(_o.warn);console.log=function(){_o.log.apply(console,_s([].slice.call(arguments)));};console.info=function(){_o.info.apply(console,_s([].slice.call(arguments)));};window.addEventListener('error',function(e){if(e.message&&_sup.some(function(s){return e.message.includes(s);})){e.stopImmediatePropagation();}},true);})();`
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-black text-black dark:text-white" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <PWARegistration />
          {children}
          <StickyShareButton />
          <StylesSafelist />
        </ThemeProvider>
      </body>
    </html>
  );
}
