# 🕌 QURAN AI APP — Complete Build Guide for Gemini Agent

> **Stack:** Next.js 14 (App Router) · AlQuran Cloud API · Islamic Network Audio CDN · Gemini 1.5 Flash  
> **Features:** Full Mushaf · AI Tafseer Chat · Emotional Support Mode · Audio Recitation

---

## 1. Project Overview

Build a full-featured Quran web application in Next.js 14. The app has two side-by-side panels: a **Mushaf reader** on one side, and an **AI chat assistant** on the other.

Users can:
- Read any of the 114 surahs with proper Arabic rendering
- Tap any verse to instantly get its tafseer in the chat
- Listen to audio recitation per verse (multiple reciters)
- Search across the full Quran
- Activate **Emotional Support Mode** — describe a personal struggle and get the most relevant Ayahs + Hadiths

---

## 2. Project Architecture

### 2.1 Folder Structure

```
quran-ai/
├── app/
│   ├── layout.tsx                  ← Root layout (fonts, RTL, global CSS)
│   ├── page.tsx                    ← Home: renders <QuranApp />
│   └── api/
│       ├── chat/route.ts           ← POST → Gemini tafseer chat
│       └── support/route.ts        ← POST → Sad mode: returns Ayahs + Hadiths JSON
├── components/
│   ├── QuranApp.tsx                ← Main layout (Mushaf + Chat side by side)
│   ├── mushaf/
│   │   ├── SurahList.tsx           ← Sidebar: list of 114 surahs
│   │   ├── MushafReader.tsx        ← Renders Ayahs inline, handles clicks
│   │   └── AudioPlayer.tsx         ← Play/pause per verse
│   └── chat/
│       ├── ChatPanel.tsx           ← Chat UI (messages, input, quick prompts)
│       ├── SadModeButton.tsx       ← Toggle emotional-support mode
│       └── MessageBubble.tsx       ← Individual chat message renderer
├── lib/
│   ├── quranApi.ts                 ← AlQuran Cloud API wrapper
│   ├── audioApi.ts                 ← Islamic Network audio URL builder
│   └── gemini.ts                   ← Gemini API helper
├── types/
│   └── quran.ts                    ← TypeScript interfaces
└── styles/
    └── globals.css                 ← Arabic fonts, RTL, custom scrollbar
```

### 2.2 Data Flow

| User Action | What Happens |
|---|---|
| Opens app | SurahList fetches all 114 surahs from AlQuran Cloud. Surah 1 loads by default. |
| Taps an Ayah | MushafReader calls `onVerseClick(ayah)`. QuranApp passes it to ChatPanel, which auto-sends a tafseer request to `/api/chat`. |
| Types in chat | ChatPanel POSTs `{ message, selectedVerse, sadMode }` to `/api/chat`. Route calls Gemini with appropriate system prompt. |
| Clicks 💚 button | `sadMode=true`. On submit, calls `/api/support`. Gemini returns structured JSON with Ayahs + Hadiths. |
| Clicks audio ▶️ | AudioPlayer builds CDN URL from global ayah number and plays HTML5 Audio. No API key needed. |

---

## 3. External APIs (All Free, No Key Required)

### 3.1 AlQuran Cloud API

**Base URL:** `https://api.alquran.cloud/v1`

#### Endpoints

| Endpoint | Description |
|---|---|
| `GET /surah` | List all 114 surahs with metadata |
| `GET /surah/{n}` | Get one surah with all ayahs (default: Arabic) |
| `GET /surah/{n}/{edition}` | Get surah in specific edition/language |
| `GET /ayah/{surah}:{ayah}` | Single ayah, e.g. `/ayah/2:255` for Ayat Al-Kursi |
| `GET /search/{query}/all/{lang}` | Full-text search across the Quran |
| `GET /quran/{edition}` | Entire Quran in one request |

#### Key Edition IDs

| Edition ID | Content |
|---|---|
| `quran-uthmani` | Arabic — Uthmani script **(use this for Mushaf display)** |
| `quran-simple` | Arabic — simplified script |
| `ar.jalalayn` | Tafseer Al-Jalalayn (Arabic) |
| `ar.muyassar` | Tafseer Muyassar (Arabic, easy language) |
| `en.sahih` | English — Saheeh International |
| `en.asad` | English — Muhammad Asad |

#### API Wrapper — `lib/quranApi.ts`

```typescript
const BASE = 'https://api.alquran.cloud/v1';

export async function getSurahList() {
  const res = await fetch(`${BASE}/surah`, { next: { revalidate: 86400 } });
  const data = await res.json();
  return data.data as Surah[];
}

export async function getSurah(number: number, edition = 'quran-uthmani') {
  const res = await fetch(`${BASE}/surah/${number}/${edition}`, {
    next: { revalidate: 86400 }  // Cache 24h — Quran never changes
  });
  const data = await res.json();
  return data.data as SurahDetail;
}

export async function searchQuran(query: string, lang = 'ar') {
  const res = await fetch(`${BASE}/search/${encodeURIComponent(query)}/all/${lang}`);
  const data = await res.json();
  return data.data.matches as AyahMatch[];
}
```

#### Example API Response

```json
{
  "number": 1,
  "name": "سُورَةُ ٱلْفَاتِحَةِ",
  "englishName": "Al-Fatiha",
  "englishNameTranslation": "The Opening",
  "numberOfAyahs": 7,
  "revelationType": "Meccan",
  "ayahs": [
    {
      "number": 1,
      "numberInSurah": 1,
      "text": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      "juz": 1,
      "page": 1
    }
  ]
}
```

> ⚠️ **Important:** `number` = global ayah number (1–6236). `numberInSurah` = position within the surah. Use `number` for audio URLs!

---

### 3.2 Islamic Network Audio CDN

**No API key. No registration. Just build the URL.**

```
https://cdn.islamic.network/quran/audio/{bitrate}/{reciter}/{globalAyahNumber}.mp3
```

#### Available Reciters

| Reciter ID | Name |
|---|---|
| `ar.alafasy` | Sheikh Mishary Rashid Alafasy *(default, most popular)* |
| `ar.minshawi` | Sheikh Mohamed Siddiq El-Minshawi |
| `ar.husary` | Sheikh Mahmoud Khalil Al-Husary |
| `ar.abdulbasit` | Sheikh Abdul Basit Abd us-Samad |

**Bitrates:** `128` (good quality) · `64` (smaller size)

#### URL Examples

```
# Al-Fatiha verse 1 (global ayah #1):
https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3

# Ayat Al-Kursi — Al-Baqara:255 (global ayah #255):
https://cdn.islamic.network/quran/audio/128/ar.alafasy/255.mp3
```

> ⚠️ **Critical:** Always use `ayah.number` (global 1–6236) for audio URLs, NOT `ayah.numberInSurah`.

#### Audio Helper — `lib/audioApi.ts`

```typescript
export type Reciter = 'ar.alafasy' | 'ar.minshawi' | 'ar.husary' | 'ar.abdulbasit';

export function getAyahAudioUrl(
  globalAyahNumber: number,
  reciter: Reciter = 'ar.alafasy',
  bitrate: 64 | 128 = 128
): string {
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${globalAyahNumber}.mp3`;
}
```

---

## 4. Gemini AI Integration

### 4.1 Setup

```bash
npm install @google/generative-ai
```

```
# .env.local
GEMINI_API_KEY=your_key_here
```

### 4.2 Gemini Helper — `lib/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function askGemini(prompt: string, systemInstruction: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction,
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### 4.3 Tafseer Chat Route — `app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

const TAFSEER_SYSTEM = `
You are an expert Islamic scholar specializing in Quran tafseer.
When explaining a verse:
  1. State the verse reference (Surah name, Ayah number)
  2. Give the literal meaning clearly
  3. Explain the historical/revelation context (Asbab Al-Nuzul) if relevant
  4. Explain the deeper spiritual meaning
  5. Mention key lessons for daily life
Reply in the same language the user used (Arabic or English).
Be respectful, accurate, and cite scholars when possible.
`;

export async function POST(req: NextRequest) {
  const { message, selectedVerse } = await req.json();

  let prompt = message;
  if (selectedVerse) {
    prompt = `Verse: ${selectedVerse.surahName} ${selectedVerse.numberInSurah}:\n`;
    prompt += `"${selectedVerse.text}"\n\nUser question: ${message}`;
  }

  const reply = await askGemini(prompt, TAFSEER_SYSTEM);
  return NextResponse.json({ reply });
}
```

### 4.4 Emotional Support Route — `app/api/support/route.ts`

This is the **"أنا متضايق"** feature. Gemini returns structured JSON.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

const SUPPORT_SYSTEM = `
You are a compassionate Islamic counselor and Quran scholar.
The user is going through difficulty and needs spiritual comfort.

Your response MUST be valid JSON with this EXACT structure (no markdown fences):
{
  "empathy": "A warm, human opening acknowledging their pain (2-3 sentences)",
  "ayahs": [
    {
      "reference": "Surah Name : Ayah number  e.g. Al-Baqara: 286",
      "arabic": "Arabic text of the ayah",
      "translation": "Clear English translation",
      "relevance": "One sentence explaining why this helps their situation"
    }
  ],
  "hadiths": [
    {
      "text": "The hadith text",
      "source": "e.g. Sahih Bukhari 6369",
      "relevance": "Why this hadith helps"
    }
  ],
  "closing": "Closing words of encouragement (2-3 sentences)"
}

Return 3-5 ayahs and 1-2 hadiths. Be accurate. NEVER fabricate hadiths.
`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const rawReply = await askGemini(message, SUPPORT_SYSTEM);

  // Strip markdown fences if Gemini wraps in ```json
  const json = rawReply.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(json);
  return NextResponse.json(parsed);
}
```

---

## 5. TypeScript Interfaces — `types/quran.ts`

```typescript
export interface Surah {
  number: number;                          // 1–114
  name: string;                            // Arabic: سُورَةُ ٱلْفَاتِحَةِ
  englishName: string;                     // Al-Fatiha
  englishNameTranslation: string;          // The Opening
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;          // GLOBAL number (1–6236) — use for audio!
  numberInSurah: number;   // Position within surah (1-based) — use for display
  text: string;            // Arabic text (Uthmani script)
  juz: number;
  page: number;
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedVerse?: {
    surahName: string;
    numberInSurah: number;
    text: string;
  };
}

export interface SupportResponse {
  empathy: string;
  ayahs: Array<{
    reference: string;
    arabic: string;
    translation: string;
    relevance: string;
  }>;
  hadiths: Array<{
    text: string;
    source: string;
    relevance: string;
  }>;
  closing: string;
}
```

---

## 6. Key Component Specs

### 6.1 QuranApp.tsx — Root Component

```tsx
'use client';
import { useState } from 'react';

export default function QuranApp() {
  const [selectedVerse, setSelectedVerse] = useState<Ayah | null>(null);
  const [sadMode, setSadMode] = useState(false);
  const [currentSurah, setCurrentSurah] = useState<SurahDetail | null>(null);

  return (
    <div className="flex h-screen bg-[#0A0F1E] text-[#E8D5B0]" dir="rtl">
      {/* Surah List sidebar — fixed ~250px */}
      <SurahList onSelect={setCurrentSurah} current={currentSurah?.number} />

      {/* Mushaf Panel — 55% of remaining width */}
      <MushafReader
        surah={currentSurah}
        onVerseClick={(ayah) => setSelectedVerse(ayah)}
        selectedVerse={selectedVerse}
      />

      {/* Chat Panel — 45% of remaining width */}
      <ChatPanel
        selectedVerse={selectedVerse}
        sadMode={sadMode}
        onSadModeChange={setSadMode}
      />
    </div>
  );
}
```

### 6.2 MushafReader.tsx — Critical Rules

- Render all ayahs **inline** (NOT one per line) to mimic real Mushaf layout
- Each ayah: Arabic text + circular verse number badge
- Clicking an ayah: golden highlight outline + call `onVerseClick`
- Small `▶` audio button per ayah
- **Skip Bismillah for Surah 9 (At-Tawbah) only**

```tsx
// Critical Mushaf text styles:
style={{
  fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
  fontSize: '24px',
  lineHeight: '2.8',      // Very important for readability
  textAlign: 'justify',
  direction: 'rtl',
}}

// Verse number badge:
<span className="inline-flex items-center justify-center
  w-7 h-7 mx-1 rounded-full text-xs font-sans
  bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)]
  text-[#C9A84C] cursor-pointer align-middle">
  {ayah.numberInSurah}
</span>
```

### 6.3 AudioPlayer.tsx

```tsx
'use client';
import { useState, useRef } from 'react';
import { getAyahAudioUrl, Reciter } from '@/lib/audioApi';

export function AudioPlayer({ globalAyahNumber }: { globalAyahNumber: number }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(getAyahAudioUrl(globalAyahNumber, 'ar.alafasy'));
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) { audioRef.current.pause(); }
    else { audioRef.current.play(); }
    setPlaying(p => !p);
  };

  return (
    <button onClick={toggle} className="text-[#C9A84C] hover:text-[#F0D070] transition-colors text-sm">
      {playing ? '⏸' : '▶'}
    </button>
  );
}
```

### 6.4 ChatPanel.tsx — Behavior

- Maintains `messages: ChatMessage[]` in state
- When `selectedVerse` prop changes → auto-send tafseer request
- Quick prompt chips: `ما تفسير آية الكرسي؟` · `آيات عن الصبر` · `أنا خايف من المستقبل`
- `sadMode=true` → renders `SupportResponse` with golden ayah cards
- Loading: 3 bouncing dots animation
- `Enter` to send, `Shift+Enter` for newline

---

## 7. Styling

### 7.1 Required Fonts — `app/layout.tsx`

```tsx
import { Amiri } from 'next/font/google';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
});

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={amiri.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### 7.2 Design Tokens

| Token | Value | Usage |
|---|---|---|
| bg-primary | `#0A0F1E` | Main app background |
| bg-secondary | `#0D1B2A` | Panels, cards |
| gold | `#C9A84C` | Borders, accents, verse numbers |
| gold-light | `#F0D070` | Headings, active highlights |
| text-primary | `#E8D5B0` | Main Arabic text |
| text-muted | `#8A9BB0` | Labels, metadata |
| green-accent | `#2D6A4F` | Sad mode highlights |

### 7.3 globals.css

```css
.gold-shimmer {
  height: 3px;
  background: linear-gradient(90deg, transparent, #C9A84C, #F0D070, #C9A84C, transparent);
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
```

---

## 8. Common Pitfalls & Solutions

| Pitfall | Solution |
|---|---|
| Arabic text looks bad | Must use `Amiri` or `Noto Naskh Arabic`. Set `line-height: 2.8`. Never use system fonts. |
| Audio doesn't play | Must be triggered by direct user click (`onClick`). Browser blocks autoplay. |
| Wrong ayah in audio URL | Use `ayah.number` (global 1–6236). NOT `ayah.numberInSurah`. |
| Slow first load | Use `{ next: { revalidate: 86400 } }` on all Quran fetches. Quran never changes. |
| Gemini returns ```json fences | Strip with `.replace(/```json\|```/g, '').trim()` before `JSON.parse()`. |
| RTL breaks chat bubbles | Use flexbox. Don't use `float`. User messages: `justify-start` with `dir="rtl"`. |
| Bismillah in Surah 9 | `if (surah.number !== 9) { /* show bismillah */ }` |
| Loading all surahs at once | Load surah list metadata only. Lazy-load full ayahs on surah selection. |

---

## 9. Implementation Checklist

**Phase 1 — Setup**
- [ ] `npx create-next-app@latest quran-ai --typescript --tailwind --app`
- [ ] `npm install @google/generative-ai`
- [ ] Create `.env.local` with `GEMINI_API_KEY=...`
- [ ] Add Amiri font in `layout.tsx`
- [ ] Set `<html dir="rtl" lang="ar">` in `layout.tsx`

**Phase 2 — Data Layer**
- [ ] `types/quran.ts` — all interfaces
- [ ] `lib/quranApi.ts` — `getSurahList()`, `getSurah()`, `searchQuran()`
- [ ] `lib/audioApi.ts` — `getAyahAudioUrl()`
- [ ] `lib/gemini.ts` — `askGemini()`

**Phase 3 — API Routes**
- [ ] `app/api/chat/route.ts`
- [ ] `app/api/support/route.ts`

**Phase 4 — UI Components**
- [ ] `QuranApp.tsx`
- [ ] `SurahList.tsx`
- [ ] `MushafReader.tsx`
- [ ] `AudioPlayer.tsx`
- [ ] `ChatPanel.tsx`
- [ ] `MessageBubble.tsx`
- [ ] `SadModeButton.tsx`

---

## 10. Exact Prompt to Give Gemini Agent

Copy and paste this as your first message:

---

Build a Next.js 14 (App Router) Quran AI web app with TypeScript and Tailwind CSS:

1. **Full Mushaf reader** using AlQuran Cloud API (`api.alquran.cloud/v1`). Fetch all 114 surahs. Display ayahs **inline** (not line by line) using Amiri font, 24px, line-height 2.8, RTL, justified. Use edition `quran-uthmani`. Each ayah has a circular verse-number badge. Clicking an ayah highlights it and sends a tafseer request to the chat panel.

2. **Per-ayah audio** using: `cdn.islamic.network/quran/audio/128/{reciter}/{globalAyahNumber}.mp3`. Default reciter: `ar.alafasy`. Always use `ayah.number` (global 1–6236) for the URL, NOT `numberInSurah`.

3. **AI chat panel** using Gemini 1.5 Flash via `/api/chat`. System prompt: expert Islamic scholar. Explains tafseer with: literal meaning, Asbab Al-Nuzul, spiritual meaning, and daily life lessons. Replies in the user's language (Arabic or English).

4. **Emotional support mode** (💚 button): POST to `/api/support`. Gemini returns JSON: `{ empathy: string, ayahs: [{reference, arabic, translation, relevance}], hadiths: [{text, source, relevance}], closing: string }`. Strip ```json fences before JSON.parse(). Render with golden cards.

5. **Dark Islamic UI**: background `#0A0F1E`, gold accents `#C9A84C`, text `#E8D5B0`. Two panels side by side (Mushaf 55%, Chat 45%). Surah list sidebar. RTL layout throughout.

6. Cache all Quran API calls with `{ next: { revalidate: 86400 } }`. Skip Bismillah for Surah 9 only.

---

*وَنَزَّلْنَا عَلَيْكَ الْكِتَابَ تِبْيَانًا لِّكُلِّ شَيْءٍ — An-Nahl: 89*
