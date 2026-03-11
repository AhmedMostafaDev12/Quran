import { OccasionInfo } from "@/types/athkar";

export function OccasionBanner({ info }: { info: OccasionInfo }) {
  if (!info || !info.color) return null;

  return (
    <div
      className="mx-4 mt-4 rounded-2xl p-4 text-center border"
      style={{
        backgroundColor: `${info.color}22`,
        borderColor: `${info.color}66`,
      }}
    >
      <div className="text-3xl mb-1">{info.icon}</div>
      <p style={{ fontFamily: "var(--font-amiri)", fontSize: '18px' }}
         className="text-gold-light font-bold">
        {info.labelAr}
      </p>
    </div>
  );
}
