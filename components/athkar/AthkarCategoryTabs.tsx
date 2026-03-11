'use client';

const TABS = [
  { id: 'auto',    labelAr: '🕐 تلقائي',  labelEn: 'Auto' },
  { id: 'morning', labelAr: '🌅 صباح',    labelEn: 'Morning' },
  { id: 'evening', labelAr: '🌆 مساء',    labelEn: 'Evening' },
  { id: 'sleep',   labelAr: '🌙 نوم',     labelEn: 'Sleep' },
  { id: 'special', labelAr: '✨ مناسبات', labelEn: 'Occasions' },
];

export function AthkarCategoryTabs({ active, onChange, period }: { active: string; onChange: (id: string) => void; period: string | null }) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar" dir="rtl">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-sans transition-all
            ${active === tab.id
              ? 'bg-[rgba(201,168,76,0.2)] border border-gold text-gold-light'
              : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-muted'
            }
          `}
        >
          {tab.labelAr}
          {tab.id === 'auto' && period && (
            <span className="mr-1 opacity-60 text-xs">
              ({period === 'sabah' ? 'صباح' : period === 'masa' ? 'مساء' : 'ليل'})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
