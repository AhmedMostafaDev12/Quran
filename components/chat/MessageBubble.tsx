'use client';
import { ChatMessage, SupportResponse } from '@/types/quran';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-start w-full">
        <div className="bg-[rgba(201,168,76,0.15)] border border-gold border-opacity-50 rounded-xl rounded-tr-none p-3 max-w-[85%]">
          {message.relatedVerse && (
            <div className="mb-2 p-2 bg-[#0A0F1E] rounded text-sm opacity-80 border-r-2 border-gold text-right">
              <span className="text-gold-light block mb-1">سورة {message.relatedVerse.surahName} - آية {message.relatedVerse.numberInSurah}</span>
              "{message.relatedVerse.text}"
            </div>
          )}
          <div className="whitespace-pre-wrap text-right text-base">{message.content}</div>
        </div>
      </div>
    );
  }

  // Detect and handle JSON Support Response
  if (message.role === 'assistant' && message.content.startsWith('{') && message.content.includes('"empathy"')) {
    try {
      const data = JSON.parse(message.content) as SupportResponse;
      return (
        <div className="flex justify-end w-full text-right animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-[#0A0F1E] border border-green-accent border-opacity-30 rounded-2xl rounded-tl-none p-5 w-full shadow-lg shadow-black/50">
            {/* Empathy Section */}
            <div className="mb-6 text-lg text-[#E8D5B0] leading-relaxed font-medium italic border-r-4 border-green-accent pr-4 py-1">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.empathy}</ReactMarkdown>
            </div>
            
            {/* Ayahs Grid */}
            <div className="space-y-6 mb-6">
              {data.ayahs?.map((ayah, i) => (
                <div key={i} className="bg-gradient-to-br from-[rgba(201,168,76,0.08)] to-[rgba(201,168,76,0.03)] border border-gold border-opacity-20 rounded-xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gold opacity-[0.03] rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
                  
                  <div className="text-3xl text-gold-light mb-4 font-amiri text-center leading-loose tracking-wide">
                    {ayah.arabic}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gold opacity-60 mb-4 border-b border-gold border-opacity-10 pb-2">
                    <span>{ayah.reference}</span>
                    <span className="font-serif">❖</span>
                  </div>
                  
                  <div className="text-base text-[#E8D5B0] mb-3 leading-relaxed">
                    <span className="text-gold-light font-bold ml-1">التفسير:</span>
                    {ayah.tafseer}
                  </div>
                  
                  <div className="mt-3 text-green-400 text-sm bg-black/30 p-3 rounded-lg border border-green-accent/10">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{`💡 ${ayah.relevance}`}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>

            {/* Hadiths Section */}
            {data.hadiths && data.hadiths.length > 0 && (
              <div className="space-y-4 mb-6">
                {data.hadiths.map((hadith, i) => (
                  <div key={i} className="bg-[rgba(45,106,79,0.05)] border border-green-accent border-opacity-20 rounded-xl p-5 border-dashed">
                    <div className="text-base text-[#E8D5B0] mb-3 italic leading-relaxed">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{hadith.text}</ReactMarkdown>
                    </div>
                    <div className="text-xs text-green-accent opacity-70 mb-3 font-bold flex items-center gap-2">
                       <span className="w-1 h-1 bg-green-accent rounded-full" />
                       {hadith.source}
                    </div>
                    <div className="mt-2 text-green-400 text-sm bg-black/20 p-2 rounded">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{`✨ ${hadith.relevance}`}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Closing Section */}
            <div className="mt-6 pt-4 border-t border-gold border-opacity-10 text-base text-gold-light opacity-90 text-center font-medium">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.closing}</ReactMarkdown>
            </div>
          </div>
        </div>
      );
    } catch (e) {
      console.error("Failed to parse support response:", e);
      // Fallback to standard bubble if parsing fails
    }
  }

  // Standard Assistant Message
  return (
    <div className="flex justify-end w-full">
      <div className="bg-[#0A0F1E] border border-gold border-opacity-30 rounded-xl rounded-tl-none p-4 max-w-[85%] text-right text-base leading-relaxed prose prose-invert prose-gold max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
            li: ({node, ...props}) => <li className="inline-block w-full" {...props} />,
            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gold-light mb-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gold-light mb-2" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-base font-bold text-gold-light mb-1" {...props} />,
            strong: ({node, ...props}) => <strong className="text-gold-light font-bold" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-r-4 border-gold border-opacity-50 pr-4 my-2 italic text-muted" {...props} />,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
