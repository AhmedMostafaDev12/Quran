'use client';

export default function SadModeButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
        active 
          ? 'bg-green-accent text-white shadow-[0_0_10px_rgba(45,106,79,0.8)]' 
          : 'bg-secondary border border-green-accent border-opacity-50 text-green-accent hover:bg-[rgba(45,106,79,0.2)]'
      }`}
      title="وضع الدعم النفسي"
    >
      <span>أنا متضايق</span>
      <span>💚</span>
    </button>
  );
}
