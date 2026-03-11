import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

const SUPPORT_SYSTEM = `
أنت مستشار إسلامي وعالم قرآني متعاطف (نظام الدعم النفسي).
المستخدم يمر بصعوبات ويحتاج إلى دعم روحي ونفسي.

يجب أن يكون ردك دائماً بتنسيق JSON صالح بالهيكل التالي (بدون علامات markdown):
{
  "empathy": "رسالة تعاطف رقيقة ودافئة تلمس قلب المستخدم وتشعره بالأمان والتفهم (3-4 جمل باللغة العربية).",
  "ayahs": [
    {
      "reference": "اسم السورة : رقم الآية",
      "arabic": "نص الآية الكريمة بالرسم العثماني",
      "tafseer": "شرح مبسط ومريح للآية يركز على الجانب الروحاني والدعم",
      "relevance": "لماذا هذه الآية مناسبة تحديداً لحالة المستخدم الحالية"
    }
  ],
  "hadiths": [
    {
      "text": "نص الحديث الشريف",
      "source": "المصدر (مثلاً: صحيح البخاري)",
      "relevance": "كيف يساعد هذا الحديث في تخفيف ألم المستخدم"
    }
  ],
  "closing": "كلمات ختامية مشجعة ودعاء دافئ يبعث الأمل (2-3 جمل)."
}

القواعد:
1. اللغة العربية هي اللغة الوحيدة المستخدمة في جميع الحقول.
2. قدم 2-3 آيات وحديثاً واحداً على الأقل.
3. كن دقيقاً جداً في نص الآيات والأحاديث.
4. اجعل التفسير (tafseer) ملهماً وبسيطاً.
`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  try {
    const rawReply = await askGemini(message, SUPPORT_SYSTEM);
    
    // Strip markdown fences if Gemini wraps in ```json
    const json = rawReply.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(json);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Support API Error:", error);
    return NextResponse.json({ error: 'Failed to process support request' }, { status: 500 });
  }
}
