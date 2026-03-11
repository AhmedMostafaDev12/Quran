import { Surah, SurahDetail } from '@/types/quran';

const BASE = 'https://api.alquran.cloud/v1';

export async function getSurahList() {
  const res = await fetch(`${BASE}/surah`, { next: { revalidate: 86400 } });
  const data = await res.json();
  return data.data as Surah[];
}

export async function getSurah(number: number, edition = 'quran-uthmani') {
  const res = await fetch(`${BASE}/surah/${number}/${edition}`, {
    next: { revalidate: 86400 }
  });
  const data = await res.json();
  return data.data as SurahDetail;
}

export async function searchQuran(query: string, lang = 'ar') {
  const res = await fetch(`${BASE}/search/${encodeURIComponent(query)}/all/${lang}`);
  const data = await res.json();
  return data.data.matches;
}
