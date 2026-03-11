import { HijriDate, PrayerTimes, Occasion, OccasionInfo, TimePeriod } from '@/types/athkar';

export function detectOccasion(hijri: HijriDate): OccasionInfo {
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
  if (occasion === 'jumu_ah') return 25;    // After prayer adhkar for Jumu'ah (ID 25)
  if (period === 'sabah')     return 27;    // أذكار الصباح والمساء
  if (period === 'masa')      return 27;    // أذكار الصباح والمساء
  if (period === 'nawm')      return 28;    // أذكار النوم
  return 27;
}
