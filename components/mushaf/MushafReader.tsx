'use client';
import { useState, useRef, useEffect } from 'react';
import { Ayah, SurahDetail } from '@/types/quran';
import { getAyahAudioUrl } from '@/lib/audioApi';

const toArabicNumber = (n: number) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return n.toString().split('').map(d => arabicNumbers[parseInt(d)]).join('');
};

const VerseMarker = ({ number }: { number: number }) => (
  <span className="relative inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 mx-1 sm:mx-1.5 align-middle select-none">
    <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full text-[#C29B62]">
      <path 
        d="M20 2 L23 7.5 L29 6.5 L31 12 L37 14 L34 19.5 L37 25 L31 27 L29 32.5 L23 31.5 L20 37 L17 31.5 L11 32.5 L9 27 L3 25 L6 19.5 L3 14 L9 12 L11 6.5 L17 7.5 Z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinejoin="round"
      />
      <circle cx="20" cy="19.5" r="10.5" fill="#FDF6E3" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="19.5" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
    </svg>
    <span 
      className="relative text-[12px] sm:text-[15px] font-bold text-[#1a1104]" 
      style={{ fontFamily: 'var(--font-amiri)', transform: 'translateY(1px)' }}
    >
      {toArabicNumber(number)}
    </span>
  </span>
);

export default function MushafReader({
  surah,
  onVerseClick,
  selectedVerse,
  onOpenSurahList // New prop
}: {
  surah: SurahDetail | null;
  onVerseClick: (ayah: Ayah) => void;
  selectedVerse: Ayah | null;
  onOpenSurahList?: () => void; // New prop
}) {
  const [menuAyah, setMenuAyah] = useState<Ayah | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isContinuousRef = useRef(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => {
      window.removeEventListener('resize', checkSize);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!surah) {
    return (
      <div className="p-8 text-center m-auto flex flex-col items-center gap-4">
        <div className="text-xl text-gold-light">اختر سورة للبدء</div>
        <button 
          onClick={onOpenSurahList}
          className="lg:hidden px-6 py-2 bg-gold text-[#0A0F1E] rounded-full font-bold shadow-lg flex items-center gap-2"
        >
          <span>📜</span>
          <span>قائمة السور</span>
        </button>
      </div>
    );
  }

  const firstAyah = surah.ayahs[0];
  const juzNumber = firstAyah ? firstAyah.juz : '';
  const pageNumber = firstAyah ? firstAyah.page : '';

  const playAudio = (globalAyahNumber: number, continuous: boolean = false) => {
    if (audioRef.current) audioRef.current.pause();
    isContinuousRef.current = continuous;
    setCurrentPlayingAyah(globalAyahNumber);
    setIsPlaying(true);
    const url = getAyahAudioUrl(globalAyahNumber);
    audioRef.current = new Audio(url);
    audioRef.current.onended = () => {
      if (isContinuousRef.current) {
        const nextAyah = surah.ayahs.find(a => a.number === globalAyahNumber + 1);
        if (nextAyah) playAudio(nextAyah.number, true);
        else { setIsPlaying(false); setCurrentPlayingAyah(null); }
      } else { setIsPlaying(false); setCurrentPlayingAyah(null); }
    };
    audioRef.current.play().catch(() => { setIsPlaying(false); setCurrentPlayingAyah(null); });
  };

  const stopAudio = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setCurrentPlayingAyah(null);
    isContinuousRef.current = false;
  };

  return (
    <div className="w-full text-[#1a1104] p-2 sm:p-4 md:p-8 flex justify-center relative" dir="rtl">
      {/* Mobile Floating Button */}
      <button 
        onClick={onOpenSurahList}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gold text-[#0A0F1E] rounded-full shadow-2xl border-2 border-[#0A0F1E]/20 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all"
        title="قائمة السور"
      >
        📜
      </button>

      {/* Context Menu */}
      {menuAyah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setMenuAyah(null)}>
          <div className="bg-[#FDF6E3] border-2 border-[#C29B62] rounded-lg shadow-2xl p-5 w-full max-w-[320px] text-right" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold text-[#C29B62] mb-4 border-b border-[#C29B62]/30 pb-2 flex justify-between items-center">
              <span>خيارات الآية {toArabicNumber(menuAyah.numberInSurah)}</span>
              <button onClick={() => setMenuAyah(null)} className="text-sm opacity-50">✕</button>
            </h3>
            <div className="flex flex-col gap-1.5">
              <button onClick={() => { onVerseClick(menuAyah); setMenuAyah(null); }} className="w-full text-right p-3 hover:bg-[#C29B62]/10 rounded-md transition-colors flex items-center gap-3">
                <span className="text-lg">📖</span><span>عرض التفسير</span>
              </button>
              <button onClick={() => { playAudio(menuAyah.number, false); setMenuAyah(null); }} className="w-full text-right p-3 hover:bg-[#C29B62]/10 rounded-md transition-colors flex items-center gap-3">
                <span className="text-lg">🔊</span><span>الاستماع لهذه الآية فقط</span>
              </button>
              <button onClick={() => { playAudio(menuAyah.number, true); setMenuAyah(null); }} className="w-full text-right p-3 hover:bg-[#C29B62]/10 rounded-md transition-colors flex items-center gap-3 text-[#2D6A4F] font-bold">
                <span className="text-lg">🔁</span><span>بدء الاستماع من هذه الآية</span>
              </button>
              {isPlaying && (
                <button onClick={() => { stopAudio(); setMenuAyah(null); }} className="w-full text-right p-3 hover:bg-red-50 text-red-600 rounded-md transition-colors flex items-center gap-3 mt-2 border-t border-red-100">
                  <span className="text-lg">⏹</span><span>إيقاف الاستماع</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[900px] border-[2px] sm:border-[3px] border-[#C29B62] p-1 sm:p-1.5 relative shadow-2xl bg-[#FDF6E3] rounded-sm">
        <div className="w-full border border-[#C29B62] p-3 sm:p-6 relative flex flex-col">
          <div className="flex justify-between items-center border-b border-t border-[#C29B62] py-1.5 mb-4 sm:mb-8 text-[#C29B62] text-sm sm:text-lg px-2" style={{ fontFamily: 'var(--font-amiri)' }}>
            <div className="flex items-center gap-1 font-bold"><span>الجزء</span><span>{toArabicNumber(juzNumber as number)}</span></div>
            <div className="text-lg">❁</div>
            <div className="flex items-center gap-1 font-bold"><span>{surah.name}</span></div>
          </div>

          <div className="mx-auto w-full max-w-xs sm:max-w-md border-2 border-[#C29B62] bg-[rgba(194,155,98,0.1)] mb-4 sm:mb-8 py-3 sm:py-5 relative flex items-center justify-center overflow-hidden">
            <div className="absolute top-0 right-0 w-3 h-3 border-b border-l border-[#C29B62]"></div>
            <div className="absolute top-0 left-0 w-3 h-3 border-b border-r border-[#C29B62]"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-t border-l border-[#C29B62]"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-t border-r border-[#C29B62]"></div>
            <h1 className="text-2xl sm:text-4xl text-[#1a1104] font-bold" style={{ fontFamily: 'var(--font-amiri)' }}>{surah.name}</h1>
          </div>

          {surah.number !== 9 && surah.number !== 1 && (
            <div className="text-center text-xl sm:text-3xl mb-4 sm:mb-8 text-[#1a1104] font-bold" style={{ fontFamily: 'var(--font-amiri)' }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
          )}

          <div className="text-justify leading-[2.2] sm:leading-[2.6]" style={{ fontFamily: 'var(--font-amiri)', fontSize: isMobile ? '22px' : '32px' }}>
            {surah.ayahs.map((ayah) => {
              let text = ayah.text;
              if (ayah.numberInSurah === 1 && surah.number !== 1) {
                const words = text.split(' ');
                if (words[0] === "بِسْمِ") text = words.slice(4).join(' ');
              }
              const isSelected = selectedVerse?.number === ayah.number;
              const isCurrentlyPlaying = currentPlayingAyah === ayah.number;
              return (
                <span key={ayah.number} onClick={() => setMenuAyah({ ...ayah, surahName: surah.name })} className={`inline cursor-pointer transition-all px-0.5 rounded ${isSelected ? 'bg-[rgba(194,155,98,0.25)] ring-1 ring-[#C29B62]' : isCurrentlyPlaying ? 'bg-green-50 ring-1 ring-green-200' : 'hover:bg-[rgba(0,0,0,0.03)]'}`}>
                  <span className={`inline ${isCurrentlyPlaying ? 'text-green-800' : ''}`}>{text}</span>
                  <VerseMarker number={ayah.numberInSurah} />
                </span>
              );
            })}
          </div>
          <div className="flex-1"></div>
          <div className="mt-6 sm:mt-12 flex justify-center items-center">
            <div className="border border-[#C29B62] px-4 sm:px-6 py-1 text-sm sm:text-xl font-bold text-[#1a1104]" style={{ fontFamily: 'var(--font-amiri)' }}>{toArabicNumber(pageNumber as number)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
