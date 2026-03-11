import { PrayerTimes, HijriDate } from '@/types/athkar';

const ALADHAN = 'https://api.aladhan.com/v1';

export async function getPrayerTimesAndHijri(
  latitude: number,
  longitude: number,
  method = 5
): Promise<{ timings: PrayerTimes; hijri: HijriDate }> {
  const res = await fetch(
    `${ALADHAN}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`,
    { next: { revalidate: 3600 } }
  );
  const data = await res.json();
  return {
    timings: data.data.timings,
    hijri: data.data.date.hijri,
  };
}

export async function getPrayerTimesByCity(
  city: string,
  country: string,
  method = 5
): Promise<{ timings: PrayerTimes; hijri: HijriDate }> {
  const res = await fetch(
    `${ALADHAN}/timingsByCity?city=${city}&country=${country}&method=${method}`,
    { next: { revalidate: 3600 } }
  );
  const data = await res.json();
  return {
    timings: data.data.timings,
    hijri: data.data.date.hijri,
  };
}
