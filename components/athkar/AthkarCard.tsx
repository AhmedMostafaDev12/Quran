'use client';
import { useState } from 'react';
import { Dhikr } from '@/types/athkar';

interface AthkarCardProps {
  dhikr: Dhikr;
  index: number;
}

export function AthkarCard({ dhikr, index }: AthkarCardProps) {
  const [counter, setCounter] = useState(0);
  
  const extractCount = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return 1;
    if (typeof str === 'number') return str;
    const match = str.match(/\d+/);
    if (match) return parseInt(match[0]);
    if (str.includes('مرة')) return 1;
    return 1;
  };

  // Check both API versions (Hisnmuslim uppercase and Gemini lowercase)
  const targetCount = extractCount(dhikr.REPEAT || dhikr.count);
  const completed = counter >= targetCount;
  const text = dhikr.ARABIC_TEXT || dhikr.content || dhikr.arabic || '';

  return (
    <div className={`
      rounded-2xl border p-5 transition-all duration-300
      ${completed
        ? 'bg-[rgba(45,106,79,0.15)] border-[#2D6A4F]'
        : 'bg-[rgba(13,27,42,0.8)] border-[rgba(201,168,76,0.15)]'
      }
    `}>
      <div className="flex justify-between items-start mb-4">
        <span className="w-8 h-8 rounded-full bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)] text-gold text-xs flex items-center justify-center font-sans">
          {index}
        </span>
        {completed && (
          <span className="text-green-accent text-xl">✓</span>
        )}
      </div>

      <p style={{ fontFamily: "var(--font-amiri)", fontSize: '22px', lineHeight: '2.2' }}
         className="text-primary mb-4 text-justify">
        {text}
      </p>

      {dhikr.description && (
        <p className="text-muted text-xs mb-3 font-sans">{dhikr.description}</p>
      )}

      {dhikr.source && (
        <p className="text-gold text-xs mb-3 font-sans opacity-70">{dhikr.source}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => setCounter(c => Math.min(c + 1, targetCount))}
          disabled={completed}
          className={`
            px-6 py-2 rounded-full text-sm font-sans transition-all
            ${completed
              ? 'bg-[rgba(45,106,79,0.3)] text-green-accent cursor-default'
              : 'bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)] text-gold hover:bg-[rgba(201,168,76,0.25)]'
            }
          `}
        >
          {completed ? 'تم ✓' : 'سبّح'}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-muted text-xs font-sans">{counter} / {targetCount}</span>
          <div className="w-16 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-300"
              style={{ width: `${(counter / targetCount) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
