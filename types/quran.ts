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
  surahName?: string;      // Added for context
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
    tafseer: string;
    relevance: string;
  }>;
  hadiths: Array<{
    text: string;
    source: string;
    relevance: string;
  }>;
  closing: string;
}
