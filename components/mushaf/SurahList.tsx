'use client';
import { useEffect, useState } from 'react';
import { Surah, SurahDetail } from '@/types/quran';
import { getSurahList, getSurah } from '@/lib/quranApi';

export default function SurahList({ 
  onSelect, 
  current 
}: { 
  onSelect: (s: SurahDetail) => void, 
  current?: number 
}) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchList() {
      const list = await getSurahList();
      setSurahs(list);
      if (list.length > 0) {
        const first = await getSurah(1);
        onSelect(first);
      }
      setLoading(false);
    }
    fetchList();
  }, []);

  const handleSelect = async (surahNumber: number) => {
    const detail = await getSurah(surahNumber);
    onSelect(detail);
  };

  if (loading) return <div className="p-4 text-center">جاري التحميل...</div>;

  return (
    <div className="h-full overflow-y-auto bg-secondary p-4 space-y-2">
      <h2 className="text-xl font-bold text-gold-light mb-4 text-center border-b border-gold pb-2">الفهرس</h2>
      {surahs.map(surah => (
        <button
          key={surah.number}
          onClick={() => handleSelect(surah.number)}
          className={`w-full text-right px-4 py-2 rounded-lg transition-colors flex justify-between items-center ${
            current === surah.number 
            ? 'bg-gold text-[#0A0F1E] font-bold' 
            : 'hover:bg-[rgba(201,168,76,0.1)]'
          }`}
        >
          <span>{surah.number}. {surah.name}</span>
          <span className="text-sm opacity-70 text-left">{surah.englishName}</span>
        </button>
      ))}
    </div>
  );
}
