import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'your_key_here') {
  console.warn("⚠️ GEMINI_API_KEY is missing or using the placeholder in .env.local.");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function askGemini(prompt: string, systemInstruction: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error details:", error.message || error);
    throw error;
  }
}
