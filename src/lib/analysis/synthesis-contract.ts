import { readingSchema } from "../core";
import type { Reading } from "../types";
import type { AnalysisBundle } from "./types";
export const synthesisSchema = readingSchema.extend({
  keywords: readingSchema.shape.keywords.length(3),
  sections: readingSchema.shape.sections.min(7).max(12),
});
export function verifySynthesis(reading: Reading, facts: AnalysisBundle): void {
  const text = JSON.stringify(reading);
  for (const match of text.matchAll(/\b[EI][SN][TF][JP]\b/g)) {
    if (match[0] !== facts.mbti?.type)
      throw new Error(
        "종합 결과에 제공하지 않은 MBTI가 포함되어 다시 확인이 필요합니다.",
      );
  }
  const calculated = new Set(facts.saju?.pillars.map((p) => p.ganZhi) || []);
  for (const match of text.matchAll(
    /[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g,
  )) {
    if (!calculated.has(match[0]))
      throw new Error("종합 결과가 계산된 원국과 달라 다시 확인이 필요합니다.");
  }
}
