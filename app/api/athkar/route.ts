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
  try {
    const { occasion, hijriDate } = await req.json();

    const prompt = `
      The user is observing: ${occasion}
      Today's Hijri date: ${JSON.stringify(hijriDate)}
      Please provide the most important and authentic adhkar and du'as for this occasion.
    `;

    const raw = await askGemini(prompt, ATHKAR_SYSTEM);
    const json = raw.replace(/```json|```/g, '').trim();
    return NextResponse.json(JSON.parse(json));
  } catch (error) {
    console.error('Athkar API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch adhkar' }, { status: 500 });
  }
}
