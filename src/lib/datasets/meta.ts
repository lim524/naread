import type { ContentMeta } from "../analysis/types";
export const DATASET_VERSION = "2026.11.11-v6";
export const references = {
  saju: {
    title: "한국민족문화대백과사전 · 사주",
    url: "https://encykorea.aks.ac.kr/Article/E0025957",
  },
  elements: {
    title: "한국민족문화대백과사전 · 오행론",
    url: "https://encykorea.aks.ac.kr/Article/E0038603",
  },
  dream: {
    title: "한국민족문화대백과사전 · 태몽",
    url: "https://encykorea.aks.ac.kr/Article/E0058917",
  },
  mbti: {
    title: "Myers & Briggs Foundation · 선호 지표",
    url: "https://www.myersbriggs.org/my-mbti-personality-type/the-mbti-preferences/",
  },
  calendar: {
    title: "6tail · lunar-typescript 소스와 역법",
    url: "https://github.com/6tail/lunar-typescript",
  },
};
export function contentMeta(
  interpretation: ContentMeta["interpretation"],
  sources: (keyof typeof references)[],
): ContentMeta {
  return {
    version: DATASET_VERSION,
    updatedAt: "2026-11-11",
    reviewStatus: "editorial-draft",
    interpretation,
    sources: sources.map((id) => references[id].url),
  };
}
export const editorialNotice =
  "개념의 참고 자료와 나읽기가 작성한 성찰 예시를 구분합니다. 콘텐츠는 편집 초안이며 명리·심리 전문가의 개별 검토를 완료하지 않았습니다.";
