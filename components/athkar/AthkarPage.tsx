'use client';
import { useState, useEffect } from 'react';
import { getPrayerTimesAndHijri, getPrayerTimesByCity } from '@/lib/prayerApi';
import { detectOccasion, getTimePeriod, getAthkarChapterForTime } from '@/lib/occasionDetector';
import { getAthkar, ATHKAR_CHAPTERS } from '@/lib/athkarApi';
import { Dhikr, OccasionInfo, TimePeriod } from '@/types/athkar';
import { AthkarCard } from './AthkarCard';
import { OccasionBanner } from './OccasionBanner';
import { AthkarCategoryTabs } from './AthkarCategoryTabs';

export default function AthkarPage() {
  const [athkar, setAthkar] = useState<Dhikr[]>([]);
  const [occasionInfo, setOccasionInfo] = useState<OccasionInfo | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(null);
  const [hijriData, setHijriData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('auto');

  useEffect(() => {
    const initContext = async () => {
      const handleData = async (lat: number, lng: number) => {
        try {
          const { timings, hijri } = await getPrayerTimesAndHijri(lat, lng);
          const occasion = detectOccasion(hijri);
          const period = getTimePeriod(timings);
          setOccasionInfo(occasion);
          setTimePeriod(period);
          setHijriData(hijri);
          return { occasion, period, hijri };
        } catch (e) {
          console.error(e);
          return null;
        }
      };

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const context = await handleData(pos.coords.latitude, pos.coords.longitude);
            if (context) await fetchAndFilterAthkar(activeTab, context.period, context.occasion, context.hijri);
          },
          async () => {
            const { timings, hijri } = await getPrayerTimesByCity('Cairo', 'Egypt');
            const context = { occasion: detectOccasion(hijri), period: getTimePeriod(timings), hijri };
            setOccasionInfo(context.occasion);
            setTimePeriod(context.period);
            setHijriData(context.hijri);
            await fetchAndFilterAthkar(activeTab, context.period, context.occasion, context.hijri);
          }
        );
      } else {
        const { timings, hijri } = await getPrayerTimesByCity('Cairo', 'Egypt');
        const context = { occasion: detectOccasion(hijri), period: getTimePeriod(timings), hijri };
        setOccasionInfo(context.occasion);
        setTimePeriod(context.period);
        setHijriData(context.hijri);
        await fetchAndFilterAthkar(activeTab, context.period, context.occasion, context.hijri);
      }
    };
    initContext();
  }, []);

  useEffect(() => {
    if (timePeriod && occasionInfo) {
      fetchAndFilterAthkar(activeTab, timePeriod, occasionInfo, hijriData);
    }
  }, [activeTab, timePeriod, occasionInfo]);

  const fetchAndFilterAthkar = async (tab: string, period: TimePeriod, occasion: OccasionInfo, hijri: any) => {
    setLoading(true);
    let chapterId: number = ATHKAR_CHAPTERS.morning;

    if (tab === 'special' || (tab === 'auto' && occasion.useGemini)) {
      try {
        const res = await fetch('/api/athkar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ occasion: occasion.labelAr || 'مناسبة إسلامية', hijriDate: hijri })
        });
        const data = await res.json();
        setAthkar(data.adhkar || []);
      } catch (e) {
        setAthkar([]);
      }
      setLoading(false);
      return;
    }

    const mode = tab === 'auto' ? period : tab;

    if (tab === 'auto') {
      chapterId = getAthkarChapterForTime(period, occasion.occasion);
    } else if (tab === 'morning') {
      chapterId = ATHKAR_CHAPTERS.morning;
    } else if (tab === 'evening') {
      chapterId = ATHKAR_CHAPTERS.evening;
    } else if (tab === 'sleep') {
      chapterId = ATHKAR_CHAPTERS.sleep;
    }

    const data = await getAthkar(chapterId);

    if (chapterId === 27) {
      const filtered = data.filter(item => {
        const text = item.ARABIC_TEXT || '';
        
        // Swapped Logic as per user request
        const isEveningRequest = mode === 'morning' || mode === 'sabah';
        const isMorningRequest = mode === 'evening' || mode === 'masa';

        const hasMorningPhrase = text.includes('أصبحنا') || text.includes('النشور');
        const hasEveningPhrase = text.includes('أمسينا') || text.includes('المصير');

        if (hasMorningPhrase && hasEveningPhrase) {
           if (isMorningRequest) return text.includes('أصبحنا وأصبح') || text.includes('النشور');
           if (isEveningRequest) return text.includes('أمسينا وأمسى') || text.includes('المصير');
        }

        if (hasMorningPhrase && !hasEveningPhrase) return isMorningRequest;
        if (hasEveningPhrase && !hasMorningPhrase) return isEveningRequest;

        return true;
      });
      setAthkar(filtered);
    } else {
      setAthkar(data);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      <div className="flex items-center justify-between p-4 border-b border-gold border-opacity-30 bg-secondary">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gold-light">الأذكار والأدعية</h2>
          <a 
            href="https://www.hisnmuslim.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gold-light hover:underline flex items-center gap-1 mt-0.5 transition-all"
          >
            <span>المصدر: حصن المسلم</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>
        <div className="text-xs text-muted font-sans">
          {occasionInfo?.labelAr && <span className="ml-2">{occasionInfo.labelAr}</span>}
        </div>
      </div>

      {occasionInfo?.occasion !== 'regular' && occasionInfo && (
        <OccasionBanner info={occasionInfo} />
      )}

      <AthkarCategoryTabs active={activeTab} onChange={setActiveTab} period={timePeriod} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-secondary rounded-2xl h-40 border border-gold border-opacity-10" />
            ))}
          </div>
        ) : (
          athkar.map((dhikr, i) => (
            <AthkarCard key={i} dhikr={dhikr} index={i + 1} />
          ))
        )}
        {!loading && athkar.length === 0 && (
          <div className="text-center py-20 text-muted">
            لا توجد أذكار متاحة حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
