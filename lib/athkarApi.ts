import { Dhikr } from '@/types/athkar';

const HISN = 'https://www.hisnmuslim.com/api/ar';

export const ATHKAR_CHAPTERS = {
  morning:  27,  // أذكار الصباح والمساء
  evening:  27,  // أذكار الصباح والمساء
  sleep:    28,  // أذكار النوم
  wakeup:   1,   // أذكار الاستيقاظ
  afterPrayer: 25, // Updated from probe (ID 25: الأذكار بعد السلام من الصلاة)
  distress: 34,  // Updated from probe (ID 34: دعاء الهم والحزن)
} as const;

export async function getAthkar(chapterId: number): Promise<Dhikr[]> {
  try {
    const res = await fetch(`${HISN}/${chapterId}.json`, {
      next: { revalidate: 86400 }
    });
    const data = await res.json();
    
    const keys = Object.keys(data);
    if (keys.length > 0 && Array.isArray(data[keys[0]])) {
      return data[keys[0]] as Dhikr[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching Athkar:", error);
    return [];
  }
}
