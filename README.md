# Lohia College AI

Official AI Assistant for Lohia College, Churu (Rajasthan).

## Setup

```bash
npm install
npm run dev          # Frontend: http://localhost:3000
```

## Voice Backend (Separate)

```bash
cd voice-backend
npm install
npm start            # Voice Proxy: http://localhost:3001
```

## Environment Variables

See `ENV_DEPLOY_GUIDE.txt` for complete list of variables needed for:
- **Frontend** (AWS / Vercel hosting)
- **Voice Backend** (VPS — voice.asklohia.online)

## Deploy

- **Frontend:** Any Node.js host (Vercel / AWS / Hostinger)
- **Voice Proxy:** Hostinger VPS → `voice-backend/README.md` ke steps follow karo

## Tech

- Next.js 15 · TypeScript · Tailwind CSS
- Voice: Vertex AI Live API (Google Cloud)
- Database: Supabase (PostgreSQL)
- Cache: Upstash Redis
- Storage: Cloudflare R2
