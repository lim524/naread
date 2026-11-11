import { CircleUserRound, CloudMoon, Layers, Users } from "lucide-react";
import type { Kind } from "@/lib/types";
function YinYang({ size = 32 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M16 3a6.5 6.5 0 0 1 0 13 6.5 6.5 0 0 0 0 13 13 13 0 0 0 0-26Z"
        fill="currentColor"
      />
      <circle cx="16" cy="9.5" r="1.7" fill="currentColor" />
      <circle cx="16" cy="22.5" r="1.7" fill="#fff" />
    </svg>
  );
}
export function CategoryIcon({
  kind,
  className = "",
}: {
  kind: Kind;
  className?: string;
}) {
  const Icon = {
    saju: YinYang,
    mbti: Users,
    dream: CloudMoon,
    comprehensive: Layers,
  }[kind];
  return (
    <span className={`category-icon ${kind} ${className}`}>
      <Icon size={32} strokeWidth={1.35} />
      {kind === "dream" && <i>✦</i>}
    </span>
  );
}
export function Avatar() {
  return (
    <span className="avatar">
      <CircleUserRound size={22} />
    </span>
  );
}
export function Note() {
  return (
    <p className="disclaimer">
      나읽기의 해석은 자기 이해를 위한 문화·성격 콘텐츠입니다. 미래를 예측하거나
      의학·법률·투자 판단을 대신하지 않습니다.
    </p>
  );
}
