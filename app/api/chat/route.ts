import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

const TAFSEER_SYSTEM = `
أنت عالم إسلامي خبير متخصص في تفسير القرآن الكريم.
عند شرح آية:
  1. اذكر مرجع الآية (اسم السورة، رقم الآية)
  2. أعطِ المعنى اللفظي بوضوح
  3. اشرح سياق النزول (أسباب النزول) إذا كان ذا صلة
  4. اشرح المعنى الروحي العميق
  5. اذكر الدروس الرئيسية للحياة اليومية
يجب أن يكون الرد باللغة العربية دائماً.
كن محترماً ودقيقاً واستشهد بالعلماء كلما أمكن ذلك.
`;

export async function POST(req: NextRequest) {
  const { message, selectedVerse } = await req.json();

  let prompt = message;
  if (selectedVerse) {
    prompt = `Verse: ${selectedVerse.surahName} ${selectedVerse.numberInSurah}:\n`;
    prompt += `"${selectedVerse.text}"\n\nUser question: ${message}`;
  }

  try {
    const reply = await askGemini(prompt, TAFSEER_SYSTEM);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ reply: 'عذراً، حدث خطأ أثناء معالجة طلبك.' }, { status: 500 });
  }
}
