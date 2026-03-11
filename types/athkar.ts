import { Surah, SurahDetail, Ayah, ChatMessage, SupportResponse } from './quran';

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

export interface Dhikr {
  ID?: number;
  ARABIC_TEXT?: string;
  REPEAT?: string | number;
  // Fallbacks for Gemini responses
  content?: string;
  arabic?: string;
  count?: string | number;
  description?: string;
  source?: string;
}

export interface GeminiAthkarResponse {
  occasion: string;
  intro: string;
  adhkar: Dhikr[];
}

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
  color: string;
  icon: string;
  useGemini: boolean;
}

export type TimePeriod = 'sabah' | 'masa' | 'nawm' | 'jumuah';
