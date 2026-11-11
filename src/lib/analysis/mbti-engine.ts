import { mbtiMeta, mbtiProfiles, mbtiSectionNames } from "../datasets/mbti";
import type { MbtiAnalysis, MbtiLetter } from "./types";
export function analyzeMbti(
  type: string,
  source: MbtiAnalysis["source"] = "self-reported",
): MbtiAnalysis {
  if (!/^[EI][SN][TF][JP]$/.test(type) || !mbtiProfiles[type])
    throw new Error("올바른 MBTI 유형을 선택해 주세요.");
  const profile = mbtiProfiles[type];
  return {
    meta: mbtiMeta,
    type,
    source,
    title: profile.title,
    summary: profile.summary,
    letters: type.split("") as MbtiLetter[],
    sections: [
      ...profile.paragraphs.map((body, i) => ({
        title: mbtiSectionNames[i],
        body,
        ruleId: `mbti-${type}-${i + 1}`,
      })),
      ...profile.scenes.map((s, i) => ({
        ...s,
        ruleId: `mbti-${type}-example-${i + 1}`,
      })),
    ],
  };
}
