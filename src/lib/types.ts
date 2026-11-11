export const kinds = ["saju", "mbti", "dream", "comprehensive"] as const;
export type Kind = (typeof kinds)[number];
export const labels: Record<Kind, string> = {
  saju: "사주팔자",
  mbti: "MBTI",
  dream: "태몽",
  comprehensive: "종합 분석",
};
export type AnalysisInput = {
  kind: Kind;
  name: string;
  birthDate: string;
  birthTime: string;
  unknownTime: boolean;
  calendar: "solar" | "lunar";
  leapMonth: boolean;
  mbti: string;
  dream: string;
  unknownMbti?: boolean;
  unknownDream?: boolean;
  introduction?: string;
  unknownSaju?: boolean;
  mbtiSource?: "self-reported" | "quick-reflection";
  dreamCorrection?: import("./analysis/dream-parser").DreamCorrection;
};
export type Reading = {
  storyVersion?: string;
  analysis?: import("./analysis/types").AnalysisBundle;
  title: string;
  subtitle: string;
  summary: string;
  keywords: string[];
  sections: { title: string; body: string }[];
  advice: string;
};
export type Fortune = {
  message: string;
  overall: string;
  money: string;
  love: string;
  relationships: string;
  work: string;
  advice: string;
  color: string;
  number: number;
};
export type SavedReading = {
  id: string;
  kind: Kind;
  result: Reading;
  input: AnalysisInput;
  created_at: string;
};
