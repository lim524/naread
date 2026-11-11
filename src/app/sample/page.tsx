import Reading from "@/components/reading";
import { datasetReading } from "@/lib/analysis/engine";
export const metadata = {
  title: "샘플 프로필 — 흑룡의 탐구자",
  description: "나읽기의 종합 분석 샘플을 만나보세요.",
  alternates: { canonical: "/sample" },
};
export default function Sample() {
  return (
    <main id="main" className="narrow-page">
      <Reading
        reading={datasetReading({
          kind: "comprehensive",
          name: "예시",
          birthDate: "1995-05-21",
          birthTime: "14:30",
          unknownTime: false,
          calendar: "solar",
          leapMonth: false,
          mbti: "INTP",
          dream: "어머니가 검은 용이 하늘로 올라가는 꿈을 꾸셨어요.",
        })}
        isSample
        mbti="INTP"
      />
    </main>
  );
}
