import type { AnalysisInput, Reading } from "../types";
import type { AnalysisBundle } from "./types";
import { analyzeSaju } from "./saju-engine";
import { analyzeMbti } from "./mbti-engine";
import { parseDream } from "./dream-parser";
import { matchDreamImage } from "./dream-image-matcher";
import { DATASET_VERSION } from "../datasets/meta";
import { elements, stems } from "../datasets/saju";
import { preferences } from "../datasets/mbti-preferences";
import { connectionPrompts } from "../datasets/connections";
import { compositeReading } from "./composite-reading";
import { storyReading } from "./story-reading";

export function analyzeInput(input: AnalysisInput): AnalysisBundle {
  const comprehensive = input.kind === "comprehensive";
  const saju =
    (input.kind === "saju" || comprehensive) && !input.unknownSaju
      ? analyzeSaju(input)
      : null;
  const mbti =
    (input.kind === "mbti" || comprehensive) && !input.unknownMbti && input.mbti
      ? analyzeMbti(input.mbti, input.mbtiSource)
      : null;
  const dream =
    (input.kind === "dream" || comprehensive) &&
    !input.unknownDream &&
    input.dream
      ? parseDream(input.dream, input.dreamCorrection)
      : null;
  const missing: AnalysisBundle["missing"] = [];
  if (!saju) missing.push("saju");
  if (!mbti) missing.push("mbti");
  if (!dream || !dream.symbols.length) missing.push("dream");
  const connections: AnalysisBundle["connections"] =
    saju && mbti
      ? mbti.letters.map((letter) => ({
          letter,
          title: `${letter} · ${preferences[letter].name}와 ${elements[saju.dayElement].name}의 이미지`,
          common: `${connectionPrompts[saju.dayElement][letter]}을 두 설명을 나란히 읽는 하나의 예시로 제안해요.`,
          difference: `‘${stems[saju.dayMaster].symbol}’은 달력 글자의 전통 비유이고, ${letter}는 사용자가 알려준 ${preferences[letter].axis}의 선호예요. 서로가 서로의 원인·증거가 아니며 실제 성격이 꼭 일치할 필요는 없습니다.`,
          question: preferences[letter].question,
          evidence: `일간 ${saju.dayMaster}(${saju.dayMasterName}) · 월지 계절 ${saju.season} · 직접 선택한 ${mbti.type}의 ${letter}. 오행 개수에서 MBTI를 추정하지 않았어요.`,
        }))
      : [];
  return {
    version: DATASET_VERSION,
    concepts: structuredClone({ elements, preferences }),
    saju,
    mbti,
    dream,
    missing,
    connections,
    image: dream
      ? matchDreamImage(
          dream.symbols.map((s) => s.id),
          dream.attributes,
          saju?.dayElement || "water",
          dream.combinations.map((c) => c.id),
        )
      : matchDreamImage([], [], saju?.dayElement || "water"),
    mode: "dataset",
  };
}
export function datasetReading(
  input: AnalysisInput,
  bundle = analyzeInput(input),
): Reading {
  const primary = bundle.saju || bundle.mbti || bundle.dream;
  if (!primary)
    throw new Error("알고 있는 분석 정보를 하나 이상 입력해 주세요.");
  if (input.kind === "comprehensive")
    return storyReading(input, {
      ...compositeReading(input, bundle),
      analysis: bundle,
    });
  const title = bundle.saju
    ? `${bundle.saju.dayMasterName}${elements[bundle.saju.dayElement].name}의 이야기`
    : bundle.mbti
      ? bundle.mbti.title
      : `${bundle.dream?.symbols[0]?.name || "꿈"}의 이야기`;
  const sections = [
    ...(bundle.saju?.sections || []),
    ...(bundle.mbti?.sections || []),
    ...(bundle.dream?.sections || []),
  ];
  const reading: Reading = {
    title,
    subtitle:
      bundle.mbti?.summary ||
      (bundle.saju
        ? `${stems[bundle.saju.dayMaster].symbol}에서 시작하는 자기 탐색`
        : "기억 속 상징과 행동을 함께 돌아보는 시간"),
    summary: bundle.saju
      ? `${input.name}님의 중심 기질은 ${bundle.saju.dayMasterName}${elements[bundle.saju.dayElement].name}입니다. ${stems[bundle.saju.dayMaster].core} ${stems[bundle.saju.dayMaster].thinking}`
      : bundle.mbti
        ? `${input.name}님이 선택한 ${bundle.mbti.type}를 바탕으로 선호와 생활의 장면을 함께 읽습니다. ${bundle.mbti.summary} 실제 성격을 확정하는 검사가 아니라 자신의 경험과 비교하는 안내예요.`
        : bundle.dream?.symbols.length
          ? `${input.name}님의 태몽에는 ${bundle.dream.symbols.map((s) => s.name).join(" · ")}이 등장합니다. ${bundle.dream.symbols.map((s) => `${s.name}의 ‘${s.meaning}’`).join("과 ")}을 중심으로, 대상의 모습과 가까워진 거리, 실제로 주고받은 행동을 함께 풀이합니다.`
          : "아직 구체적인 소재를 확인하지 못한 장면입니다. 기억나는 대상을 이름으로 적거나 확인 화면에서 소재를 선택하면 더 자세하게 읽을 수 있습니다.",
    keywords: bundle.mbti
      ? [bundle.mbti.type, "직접 선택한 선호", "자기 탐색"]
      : bundle.saju
        ? [
            elements[bundle.saju.dayElement].keyword,
            bundle.saju.dayMasterName + " 일간",
            "문화적 상징",
          ]
        : [bundle.dream?.symbols[0]?.name || "기억", "꿈의 상징", "성찰"],
    sections,
    advice: bundle.saju
      ? elements[bundle.saju.dayElement].question
      : bundle.mbti
        ? preferences[bundle.mbti.letters[0]].practice
        : "꿈에서 확인한 사실과 내가 덧붙인 느낌을 따로 적어보고, 지금 소중하게 지키고 싶은 경험 한 가지를 찾아보세요.",
    analysis: bundle,
  };
  return storyReading(input, reading);
}
