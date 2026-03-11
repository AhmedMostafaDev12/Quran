'use client';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage, Ayah, SupportResponse } from '@/types/quran';
import MessageBubble from './MessageBubble';
import SadModeButton from './SadModeButton';

export default function ChatPanel({
  selectedVerse,
  sadMode,
  onSadModeChange
}: {
  selectedVerse: Ayah | null;
  sadMode: boolean;
  onSadModeChange: (val: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'السلام عليكم ورحمة الله. كيف يمكنني مساعدتك اليوم في فهم القرآن الكريم؟',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedVerse) {
      const msg = `ما تفسير هذه الآية؟`;
      handleSend(msg, selectedVerse);
    }
  }, [selectedVerse]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text: string, verse?: Ayah | null) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
      relatedVerse: verse ? {
        surahName: verse.surahName || '',
        numberInSurah: verse.numberInSurah,
        text: verse.text
      } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const endpoint = sadMode ? '/api/support' : '/api/chat';
      const body = sadMode ? { message: text } : { message: text, selectedVerse: verse };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      let assistantContent = '';
      if (sadMode) {
        if (data.empathy) {
           assistantContent = JSON.stringify(data);
        } else {
           assistantContent = data.reply || "عذراً، حدث خطأ في النظام.";
        }
      } else {
        assistantContent = data.reply || "عذراً، حدث خطأ في النظام.";
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'عذراً، حدث خطأ أثناء الاتصال بالخادم.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      onSadModeChange(false); // Reset sad mode after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input, selectedVerse);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A]">
      <div className="flex items-center justify-between p-4 border-b border-gold border-opacity-30">
        <h2 className="text-xl font-bold text-gold-light">المساعد القرآني</h2>
        <SadModeButton active={sadMode} onClick={() => onSadModeChange(!sadMode)} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex space-x-2 justify-center p-4" dir="ltr">
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gold border-opacity-30 bg-[#0A0F1E]">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
          <button onClick={() => handleSend("ما تفسير آية الكرسي؟")} className="whitespace-nowrap px-3 py-1 bg-secondary rounded-full text-sm border border-gold border-opacity-50 hover:bg-[rgba(201,168,76,0.2)]">ما تفسير آية الكرسي؟</button>
          <button onClick={() => handleSend("آيات عن الصبر")} className="whitespace-nowrap px-3 py-1 bg-secondary rounded-full text-sm border border-gold border-opacity-50 hover:bg-[rgba(201,168,76,0.2)]">آيات عن الصبر</button>
          <button onClick={() => { onSadModeChange(true); handleSend("أنا خايف من المستقبل"); }} className="whitespace-nowrap px-3 py-1 bg-secondary rounded-full text-sm border border-gold border-opacity-50 hover:bg-[rgba(201,168,76,0.2)] text-green-accent">أنا خايف من المستقبل</button>
        </div>
        <div className="flex relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sadMode ? "تحدث عما يضايقك بحرية..." : "اسأل عن تفسير، أو ابحث عن آية..."}
            className="w-full bg-[#0D1B2A] text-[#E8D5B0] border border-gold border-opacity-50 rounded-lg p-3 pr-10 resize-none outline-none focus:border-opacity-100"
            rows={2}
          />
          <button 
            onClick={() => handleSend(input, selectedVerse)}
            className="absolute left-2 bottom-2 bg-gold text-[#0A0F1E] p-2 rounded hover:bg-gold-light transition-colors"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
