# 🕌 QURAN AI APP — Complete Build Guide for Gemini Agent

> **Stack:** Next.js 14 (App Router) · AlQuran Cloud API · Islamic Network Audio CDN · Aladhan API · Hisnmuslim API · Gemini 1.5 Flash  
> **Features:** Full Mushaf · AI Tafseer Chat · Emotional Support Mode · Audio Recitation · Smart Athkar (Time & Occasion Aware)

---

## 1. Project Overview

Build a full-featured Quran web application in Next.js 14. The app has two side-by-side panels: a **Mushaf reader** on one side, and an **AI chat assistant** on the other.

Users can:
- Read any of the 114 surahs with proper Arabic rendering
- Tap any verse to instantly get its tafseer in the chat
- Listen to audio recitation per verse (multiple reciters)
- Search across the full Quran
- Activate **Emotional Support Mode** — describe a personal struggle and get the most relevant Ayahs + Hadiths
- View **Smart Athkar** — morning/evening/night adhkar auto-selected by time of day, plus special occasion adhkar for Ramadan, Eid, Fridays, and more

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
│   └── athkar/
│       ├── AthkarPage.tsx          ← Main Athkar tab: shows current-time adhkar
│       ├── AthkarCard.tsx          ← Single dhikr card with counter
│       ├── OccasionBanner.tsx      ← Banner when special occasion detected (Ramadan, Eid…)
│       └── AthkarCategoryTabs.tsx  ← Tabs: صباح / مساء / نوم / مناسبات
├── lib/
│   ├── quranApi.ts                 ← AlQuran Cloud API wrapper
│   ├── audioApi.ts                 ← Islamic Network audio URL builder
│   ├── athkarApi.ts                ← Hisnmuslim API wrapper
│   ├── prayerApi.ts                ← Aladhan API: prayer times + Hijri date
│   ├── occasionDetector.ts         ← Detects Ramadan / Eid / Friday from Hijri date
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
| User opens Athkar tab | `prayerApi` fetches current Hijri date + prayer times. `occasionDetector` checks for Ramadan/Eid/Friday. `athkarApi` fetches matching adhkar category. Auto-selects correct time period. |
| User clicks 💚 button | `sadMode=true`. On submit, calls `/api/support`. Gemini returns structured JSON with Ayahs + Hadiths. |
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

## 8. Smart Athkar System

### 8.1 How It Works

The Athkar tab is fully automatic. When the user opens it:
1. Gets current time from the browser
2. Calls **Aladhan API** to get today's Hijri date and prayer times (using user's coordinates)
3. **`occasionDetector`** checks if today is Ramadan / Eid / Friday / regular day
4. Determines current time period: Sabah / Masa' / Nawm / Jumu'ah
5. Calls **Hisnmuslim API** to fetch the matching adhkar category
6. For special occasions not covered by the API → calls **Gemini**

---

### 8.2 Aladhan API — Prayer Times & Hijri Date

**Base URL:** `https://api.aladhan.com/v1`  
**Free, no key required.**

#### Key Endpoints

| Endpoint | Description |
|---|---|
| `GET /timings?latitude={lat}&longitude={lng}&method={n}` | Prayer times for today by coordinates |
| `GET /gToH?date={dd-mm-yyyy}` | Convert Gregorian date → Hijri |
| `GET /hToG?date={dd-mm-yyyy}` | Convert Hijri date → Gregorian |
| `GET /timingsByCity?city={city}&country={country}&method={n}` | Prayer times by city name |

#### Calculation Methods (method param)

| Method ID | Name |
|---|---|
| `2` | Islamic Society of North America (ISNA) |
| `3` | Muslim World League |
| `4` | Umm Al-Qura, Mecca **(recommended for Egypt/Arab world)** |
| `5` | Egyptian General Authority of Survey |

#### Example Response — `/timings`

```json
{
  "code": 200,
  "data": {
    "timings": {
      "Fajr": "04:32",
      "Sunrise": "06:01",
      "Dhuhr": "12:15",
      "Asr": "15:42",
      "Maghrib": "18:29",
      "Isha": "19:54"
    },
    "date": {
      "readable": "11 Mar 2026",
      "hijri": {
        "date": "11-09-1447",
        "month": { "number": 9, "en": "Ramaḍān", "ar": "رَمَضان" },
        "day": "11",
        "year": "1447",
        "weekday": { "en": "Wednesday", "ar": "الأربعاء" }
      }
    }
  }
}
```

#### Prayer Times Wrapper — `lib/prayerApi.ts`

```typescript
const ALADHAN = 'https://api.aladhan.com/v1';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface HijriDate {
  day: string;
  month: { number: number; ar: string; en: string };
  year: string;
  weekday: { en: string; ar: string };
}

export async function getPrayerTimesAndHijri(
  latitude: number,
  longitude: number,
  method = 5  // Egyptian method by default
): Promise<{ timings: PrayerTimes; hijri: HijriDate }> {
  const res = await fetch(
    `${ALADHAN}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`,
    { next: { revalidate: 3600 } }  // Cache 1 hour
  );
  const data = await res.json();
  return {
    timings: data.data.timings,
    hijri: data.data.date.hijri,
  };
}

// Fallback: by city name (if user denies location)
export async function getPrayerTimesByCity(
  city: string,
  country: string,
  method = 5
): Promise<{ timings: PrayerTimes; hijri: HijriDate }> {
  const res = await fetch(
    `${ALADHAN}/timingsByCity?city=${city}&country=${country}&method=${method}`
  );
  const data = await res.json();
  return {
    timings: data.data.timings,
    hijri: data.data.date.hijri,
  };
}
```

---

### 8.3 Hisnmuslim API — Athkar Database

**Base URL:** `https://api.hisnmuslim.com/api`  
**Free, no key required. Contains full Hisn Al-Muslim (حصن المسلم).**

#### Key Endpoints

| Endpoint | Description |
|---|---|
| `GET /ar` | All chapters in Arabic |
| `GET /ar/{chapterId}` | All adhkar in a specific chapter |

#### Important Chapter IDs

| Chapter ID | Arabic Name | Occasion |
|---|---|---|
| `1` | أذكار الاستيقاظ | Upon waking up |
| `7` | أذكار الصباح | Morning adhkar |
| `8` | أذكار المساء | Evening adhkar |
| `28` | أذكار النوم | Before sleep |
| `16` | أذكار الأذان | After Adhan |
| `19` | أذكار بعد السلام من الصلاة | After prayer |
| `34` | دعاء ختم القرآن | After completing Quran |
| `43` | أدعية الكرب والهم | For distress and worry |
| `45` | دعاء المريض | For illness |

#### Example Response

```json
[
  {
    "id": 1,
    "content": "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    "count": "مرة واحدة",
    "description": "يقول إذا استيقظ من نومه"
  }
]
```

#### Athkar API Wrapper — `lib/athkarApi.ts`

```typescript
const HISN = 'https://api.hisnmuslim.com/api';

export interface Dhikr {
  id: number;
  content: string;
  count: string;
  description?: string;
}

export const ATHKAR_CHAPTERS = {
  morning:  7,   // أذكار الصباح
  evening:  8,   // أذكار المساء
  sleep:    28,  // أذكار النوم
  wakeup:   1,   // أذكار الاستيقاظ
  afterPrayer: 19,
  distress: 43,
} as const;

export async function getAthkar(chapterId: number): Promise<Dhikr[]> {
  const res = await fetch(`${HISN}/ar/${chapterId}`, {
    next: { revalidate: 86400 }  // Adhkar never change — cache 24h
  });
  const data = await res.json();
  return data;
}
```

---

### 8.4 Occasion Detector — `lib/occasionDetector.ts`

```typescript
import { HijriDate } from './prayerApi';

export type Occasion =
  | 'ramadan'
  | 'eid_fitr'
  | 'eid_adha'
  | 'jumu_ah'
  | 'ashura'
  | 'regular';

export interface OccasionInfo {
  occasion: Occasion;
  labelAr: string;
  labelEn: string;
  color: string;       // For UI banner color
  icon: string;
  useGemini: boolean;  // true = no static API, use Gemini instead
}

export function detectOccasion(hijri: HijriDate, prayerTimes?: any): OccasionInfo {
  const month = hijri.month.number;
  const day = parseInt(hijri.day);
  const weekday = hijri.weekday.en;

  // Ramadan — entire month 9
  if (month === 9) {
    return { occasion: 'ramadan', labelAr: 'رمضان المبارك 🌙', labelEn: 'Ramadan', color: '#1B4332', icon: '🌙', useGemini: false };
  }

  // Eid Al-Fitr — 1 Shawwal
  if (month === 10 && day === 1) {
    return { occasion: 'eid_fitr', labelAr: 'عيد الفطر المبارك 🎉', labelEn: 'Eid Al-Fitr', color: '#7D3C98', icon: '🎉', useGemini: true };
  }

  // Eid Al-Adha — 10 Dhul Hijja
  if (month === 12 && day === 10) {
    return { occasion: 'eid_adha', labelAr: 'عيد الأضحى المبارك 🐑', labelEn: 'Eid Al-Adha', color: '#784212', icon: '🐑', useGemini: true };
  }

  // Ashura — 10 Muharram
  if (month === 1 && day === 10) {
    return { occasion: 'ashura', labelAr: 'يوم عاشوراء', labelEn: 'Ashura', color: '#1A5276', icon: '🤲', useGemini: true };
  }

  // Friday
  if (weekday === 'Friday') {
    return { occasion: 'jumu_ah', labelAr: 'يوم الجمعة المبارك', labelEn: "Jumu'ah", color: '#145A32', icon: '🕌', useGemini: false };
  }

  return { occasion: 'regular', labelAr: '', labelEn: '', color: '', icon: '', useGemini: false };
}
```

---

### 8.5 Time Period Detector

```typescript
// lib/occasionDetector.ts (add this)

export type TimePeriod = 'sabah' | 'masa' | 'nawm' | 'jumuah';

export function getTimePeriod(timings: PrayerTimes): TimePeriod {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const fajr    = toMinutes(timings.Fajr);
  const sunrise = toMinutes(timings.Sunrise);
  const asr     = toMinutes(timings.Asr);
  const maghrib = toMinutes(timings.Maghrib);
  const isha    = toMinutes(timings.Isha);

  // Sabah: from Fajr until 2 hours after sunrise
  if (currentMinutes >= fajr && currentMinutes < sunrise + 120) return 'sabah';

  // Masa': from Asr until Maghrib
  if (currentMinutes >= asr && currentMinutes < maghrib) return 'masa';

  // Nawm: from Isha until Fajr (late night)
  if (currentMinutes >= isha || currentMinutes < fajr) return 'nawm';

  // Default daytime
  return 'sabah';
}

export function getAthkarChapterForTime(period: TimePeriod, occasion: Occasion): number {
  if (occasion === 'jumu_ah') return 19;    // After prayer adhkar for Jumu'ah
  if (period === 'sabah')     return 7;     // أذكار الصباح
  if (period === 'masa')      return 8;     // أذكار المساء
  if (period === 'nawm')      return 28;    // أذكار النوم
  return 7;
}
```

---

### 8.6 Gemini Route for Special Occasions — `app/api/athkar/route.ts`

Used when `occasionInfo.useGemini === true` (Eid, Ashura, etc.)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

const ATHKAR_SYSTEM = `
You are an Islamic scholar specializing in du'a and adhkar.
Return ONLY valid JSON, no markdown fences.
Structure:
{
  "occasion": "Occasion name in Arabic",
  "intro": "2 sentences about the spiritual significance of this occasion",
  "adhkar": [
    {
      "arabic": "Arabic text of the dhikr or du'a",
      "transliteration": "Romanized pronunciation",
      "translation": "English translation",
      "count": "e.g. مرة واحدة or 3 مرات",
      "source": "e.g. Sahih Bukhari 1234 or Quran 2:185"
    }
  ]
}
Return 5-8 authentic adhkar. NEVER fabricate. Cite sources accurately.
`;

export async function POST(req: NextRequest) {
  const { occasion, hijriDate } = await req.json();

  const prompt = `
    The user is observing: ${occasion}
    Today's Hijri date: ${hijriDate}
    Please provide the most important and authentic adhkar and du'as for this occasion.
  `;

  const raw = await askGemini(prompt, ATHKAR_SYSTEM);
  const json = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
  return NextResponse.json(JSON.parse(json));
}
```

---

### 8.7 UI Components

#### AthkarPage.tsx — Main Logic

```tsx
'use client';
import { useState, useEffect } from 'react';
import { getPrayerTimesAndHijri } from '@/lib/prayerApi';
import { detectOccasion, getTimePeriod, getAthkarChapterForTime } from '@/lib/occasionDetector';
import { getAthkar } from '@/lib/athkarApi';

export default function AthkarPage() {
  const [athkar, setAthkar] = useState([]);
  const [occasionInfo, setOccasionInfo] = useState(null);
  const [timePeriod, setTimePeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('auto');  // auto | morning | evening | sleep

  useEffect(() => {
    const load = async () => {
      // Get user location
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { timings, hijri } = await getPrayerTimesAndHijri(
          pos.coords.latitude,
          pos.coords.longitude
        );

        const occasion = detectOccasion(hijri);
        const period = getTimePeriod(timings);
        setOccasionInfo(occasion);
        setTimePeriod(period);

        if (occasion.useGemini) {
          // Special occasion — use Gemini
          const res = await fetch('/api/athkar', {
            method: 'POST',
            body: JSON.stringify({ occasion: occasion.labelAr, hijriDate: hijri })
          });
          const data = await res.json();
          setAthkar(data.adhkar);
        } else {
          // Regular time — use Hisnmuslim API
          const chapterId = getAthkarChapterForTime(period, occasion.occasion);
          const data = await getAthkar(chapterId);
          setAthkar(data);
        }
        setLoading(false);
      }, () => {
        // Location denied — fallback to morning adhkar
        getAthkar(7).then(setAthkar);
        setLoading(false);
      });
    };
    load();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E]" dir="rtl">
      {/* Occasion Banner */}
      {occasionInfo?.occasion !== 'regular' && (
        <OccasionBanner info={occasionInfo} />
      )}

      {/* Category Tabs */}
      <AthkarCategoryTabs active={activeTab} onChange={setActiveTab} period={timePeriod} />

      {/* Athkar List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading
          ? <AthkarSkeleton />
          : athkar.map((dhikr, i) => <AthkarCard key={i} dhikr={dhikr} index={i + 1} />)
        }
      </div>
    </div>
  );
}
```

#### AthkarCard.tsx — Single Dhikr Card

```tsx
interface AthkarCardProps {
  dhikr: { content?: string; arabic?: string; count: string; description?: string; source?: string };
  index: number;
}

export function AthkarCard({ dhikr, index }: AthkarCardProps) {
  const [counter, setCounter] = useState(0);
  const targetCount = parseInt(dhikr.count) || 1;
  const completed = counter >= targetCount;
  const text = dhikr.content || dhikr.arabic || '';

  return (
    <div className={`
      rounded-2xl border p-5 transition-all duration-300
      ${completed
        ? 'bg-[rgba(45,106,79,0.15)] border-[#2D6A4F]'
        : 'bg-[rgba(13,27,42,0.8)] border-[rgba(201,168,76,0.15)]'
      }
    `}>
      {/* Index badge */}
      <div className="flex justify-between items-start mb-4">
        <span className="w-8 h-8 rounded-full bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)] text-[#C9A84C] text-xs flex items-center justify-center font-sans">
          {index}
        </span>
        {completed && (
          <span className="text-[#2D6A4F] text-xl">✓</span>
        )}
      </div>

      {/* Arabic text */}
      <p style={{ fontFamily: "'Amiri', serif", fontSize: '20px', lineHeight: '2.2' }}
         className="text-[#E8D5B0] mb-4 text-justify">
        {text}
      </p>

      {/* Description */}
      {dhikr.description && (
        <p className="text-[#8A9BB0] text-xs mb-3 font-sans">{dhikr.description}</p>
      )}

      {/* Source */}
      {dhikr.source && (
        <p className="text-[#C9A84C] text-xs mb-3 font-sans opacity-70">{dhikr.source}</p>
      )}

      {/* Counter button */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => setCounter(c => Math.min(c + 1, targetCount))}
          disabled={completed}
          className={`
            px-6 py-2 rounded-full text-sm font-sans transition-all
            ${completed
              ? 'bg-[rgba(45,106,79,0.3)] text-[#2D6A4F] cursor-default'
              : 'bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.25)]'
            }
          `}
        >
          {completed ? 'تم ✓' : 'سبّح'}
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <span className="text-[#8A9BB0] text-xs font-sans">{counter} / {targetCount}</span>
          <div className="w-16 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A84C] rounded-full transition-all duration-300"
              style={{ width: `${(counter / targetCount) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### OccasionBanner.tsx

```tsx
export function OccasionBanner({ info }: { info: OccasionInfo }) {
  return (
    <div
      className="mx-4 mt-4 rounded-2xl p-4 text-center border"
      style={{
        background: `${info.color}22`,
        borderColor: `${info.color}66`,
      }}
    >
      <div className="text-3xl mb-1">{info.icon}</div>
      <p style={{ fontFamily: "'Amiri', serif", fontSize: '18px' }}
         className="text-[#F0D070] font-bold">
        {info.labelAr}
      </p>
    </div>
  );
}
```

#### AthkarCategoryTabs.tsx

```tsx
const TABS = [
  { id: 'auto',    labelAr: '🕐 تلقائي',  labelEn: 'Auto' },
  { id: 'morning', labelAr: '🌅 صباح',    labelEn: 'Morning' },
  { id: 'evening', labelAr: '🌆 مساء',    labelEn: 'Evening' },
  { id: 'sleep',   labelAr: '🌙 نوم',     labelEn: 'Sleep' },
  { id: 'special', labelAr: '✨ مناسبات', labelEn: 'Occasions' },
];

export function AthkarCategoryTabs({ active, onChange, period }) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto" dir="rtl">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-sans transition-all
            ${active === tab.id
              ? 'bg-[rgba(201,168,76,0.2)] border border-[#C9A84C] text-[#F0D070]'
              : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#8A9BB0]'
            }
          `}
        >
          {tab.labelAr}
          {tab.id === 'auto' && period && (
            <span className="mr-1 opacity-60 text-xs">
              ({period === 'sabah' ? 'صباح' : period === 'masa' ? 'مساء' : 'ليل'})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
```

---

### 8.8 Navigation — Add Athkar Tab to Main App

Update `QuranApp.tsx` to add a bottom navigation bar:

```tsx
const MAIN_TABS = [
  { id: 'mushaf',  icon: '📖', label: 'المصحف' },
  { id: 'chat',    icon: '💬', label: 'الشات' },
  { id: 'athkar',  icon: '🤲', label: 'الأذكار' },
];

// In the JSX:
<div className="flex flex-col h-screen bg-[#0A0F1E]">
  {/* Top panels — flex-1 */}
  <div className="flex flex-1 overflow-hidden">
    {activeMainTab === 'mushaf' && <MushafLayout ... />}
    {activeMainTab === 'chat'   && <ChatPanel ... />}
    {activeMainTab === 'athkar' && <AthkarPage />}
  </div>

  {/* Bottom tab bar */}
  <div className="flex border-t border-[rgba(201,168,76,0.15)] bg-[#0D1B2A]" dir="rtl">
    {MAIN_TABS.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveMainTab(tab.id)}
        className={`
          flex-1 py-3 flex flex-col items-center gap-1 text-xs font-sans transition-all
          ${activeMainTab === tab.id ? 'text-[#F0D070]' : 'text-[#4A5D6F]'}
        `}
      >
        <span className="text-lg">{tab.icon}</span>
        {tab.label}
        {activeMainTab === tab.id && (
          <div className="w-1 h-1 rounded-full bg-[#C9A84C]" />
        )}
      </button>
    ))}
  </div>
</div>
```

---

### 8.9 Athkar UI Design Rules

| Rule | Detail |
|---|---|
| Card background | Dark (`#0D1B2A`) with gold border. Turns green when completed. |
| Counter button | Pill-shaped gold button. Shows `تم ✓` in green when target reached. |
| Progress bar | Thin gold bar under counter, fills left-to-right as user counts. |
| Occasion banner | Rounded card with semi-transparent background matching occasion color. |
| Skeleton loading | 3 placeholder cards with pulsing animation while API loads. |
| Auto tab label | Shows current time period in small parentheses: `🕐 تلقائي (صباح)` |
| Font | Amiri for Arabic text, system-ui/font-sans for counts and labels. |

---



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

## 9. Common Pitfalls & Solutions

| Pitfall | Solution |
|---|---|
| Arabic text looks bad | Must use `Amiri` or `Noto Naskh Arabic`. Set `line-height: 2.8`. Never use system fonts. |
| Audio doesn't play | Must be triggered by direct user click (`onClick`). Browser blocks autoplay. |
| Wrong ayah in audio URL | Use `ayah.number` (global 1–6236). NOT `ayah.numberInSurah`. |
| Slow first load | Use `{ next: { revalidate: 86400 } }` on all Quran fetches. Quran never changes. |
| Gemini returns \`\`\`json fences | Strip with `.replace(/\`\`\`json\|\`\`\`/g, '').trim()` before `JSON.parse()`. |
| RTL breaks chat bubbles | Use flexbox. Don't use `float`. User messages: `justify-start` with `dir="rtl"`. |
| Bismillah in Surah 9 | `if (surah.number !== 9) { /* show bismillah */ }` |
| Loading all surahs at once | Load surah list metadata only. Lazy-load full ayahs on surah selection. |
| User denies location for Athkar | Fallback to `getPrayerTimesByCity('Cairo', 'Egypt')` or just load morning adhkar by default. |
| Hisnmuslim API returns inconsistent fields | Normalize: use `dhikr.content \|\| dhikr.arabic \|\| ''` for the text field. |
| Gemini Athkar fabricates hadiths | The system prompt says NEVER fabricate + cite sources. Still add a UI disclaimer: "تحقق من المصدر". |

---

## 10. Implementation Checklist

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
- [ ] `lib/prayerApi.ts` — `getPrayerTimesAndHijri()`, `getPrayerTimesByCity()`
- [ ] `lib/athkarApi.ts` — `getAthkar()`, `ATHKAR_CHAPTERS`
- [ ] `lib/occasionDetector.ts` — `detectOccasion()`, `getTimePeriod()`, `getAthkarChapterForTime()`
- [ ] `lib/gemini.ts` — `askGemini()`

**Phase 3 — API Routes**
- [ ] `app/api/chat/route.ts`
- [ ] `app/api/support/route.ts`
- [ ] `app/api/athkar/route.ts` ← Gemini for special occasions

**Phase 4 — UI Components**
- [ ] `QuranApp.tsx` — add bottom tab bar with المصحف / الشات / الأذكار
- [ ] `SurahList.tsx`
- [ ] `MushafReader.tsx`
- [ ] `AudioPlayer.tsx`
- [ ] `ChatPanel.tsx`
- [ ] `MessageBubble.tsx`
- [ ] `SadModeButton.tsx`
- [ ] `AthkarPage.tsx` — main Athkar tab with auto-detection logic
- [ ] `AthkarCard.tsx` — dhikr card with counter + progress bar
- [ ] `OccasionBanner.tsx` — Ramadan/Eid/Friday banner
- [ ] `AthkarCategoryTabs.tsx` — tab switcher

---

## 11. Exact Prompt to Give Gemini Agent

Copy and paste this as your first message:

---

Build a Next.js 14 (App Router) Quran AI web app with TypeScript and Tailwind CSS:

1. **Full Mushaf reader** using AlQuran Cloud API (`api.alquran.cloud/v1`). Fetch all 114 surahs. Display ayahs **inline** (not line by line) using Amiri font, 24px, line-height 2.8, RTL, justified. Use edition `quran-uthmani`. Each ayah has a circular verse-number badge. Clicking an ayah highlights it and sends a tafseer request to the chat panel.

2. **Per-ayah audio** using: `cdn.islamic.network/quran/audio/128/{reciter}/{globalAyahNumber}.mp3`. Default reciter: `ar.alafasy`. Always use `ayah.number` (global 1–6236) for the URL, NOT `numberInSurah`.

3. **AI chat panel** using Gemini 1.5 Flash via `/api/chat`. System prompt: expert Islamic scholar. Explains tafseer with: literal meaning, Asbab Al-Nuzul, spiritual meaning, and daily life lessons. Replies in the user's language (Arabic or English).

4. **Emotional support mode** (💚 button): POST to `/api/support`. Gemini returns JSON: `{ empathy: string, ayahs: [{reference, arabic, translation, relevance}], hadiths: [{text, source, relevance}], closing: string }`. Strip \`\`\`json fences before JSON.parse(). Render with golden cards.

5. **Smart Athkar tab** (🤲): On open, request user geolocation then call Aladhan API (`api.aladhan.com/v1/timings?latitude=…&longitude=…&method=5`) to get prayer times and Hijri date. Detect occasion from Hijri date: month 9 = Ramadan, month 10 day 1 = Eid Fitr, month 12 day 10 = Eid Adha, Friday = Jumu'ah. Detect time period from prayer times: Fajr→Sunrise+2h = Sabah (chapter 7), Asr→Maghrib = Masa' (chapter 8), Isha→Fajr = Nawm (chapter 28). Fetch adhkar from Hisnmuslim API (`api.hisnmuslim.com/api/ar/{chapterId}`). For Eid/Ashura (no static API) → call `/api/athkar` with Gemini. Each dhikr renders as a card with: Arabic text (Amiri font), count label, tap counter button, progress bar, green completion state. Show an occasion banner for Ramadan/Eid/Friday.

6. **Bottom navigation**: three tabs — المصحف (📖) / الشات (💬) / الأذكار (🤲).

7. **Dark Islamic UI**: background `#0A0F1E`, gold accents `#C9A84C`, text `#E8D5B0`. RTL layout throughout. Amiri font for all Arabic text.

8. Cache Quran API calls with `{ next: { revalidate: 86400 } }`. Cache Aladhan with 1h. Skip Bismillah for Surah 9 only. Fallback to Cairo coordinates if user denies location.

---

*وَنَزَّلْنَا عَلَيْكَ الْكِتَابَ تِبْيَانًا لِّكُلِّ شَيْءٍ — An-Nahl: 89*
