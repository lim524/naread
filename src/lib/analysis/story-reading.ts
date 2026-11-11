import type { AnalysisInput, Reading } from "../types";
import type { Element } from "./types";
import { stems } from "../datasets/saju";
import { stemPerspectives } from "../datasets/saju-perspectives";
import { storyTopics } from "../datasets/story-topics";
import { dreamStory } from "./dream-story";
import { STORY_VERSION } from "../story-version";
import { storyScenes } from "../datasets/story-scenes";
function mbtiFlavor(type: string): Element {
  if (type[1] === "N")
    return type[2] === "F" ? "fire" : type[0] === "I" ? "water" : "metal";
  return type[3] === "J" ? "earth" : "wood";
}
export function storyReading(input: AnalysisInput, original: Reading): Reading {
  const bundle = original.analysis;
  if (!bundle) return original;
  if (!bundle.saju && !bundle.mbti)
    return {
      ...original,
      ...dreamStory(input, bundle),
      storyVersion: STORY_VERSION,
    };
  const saju = bundle.saju,
    mbti = bundle.mbti;
  const flavor = saju?.dayElement || mbtiFlavor(mbti!.type);
  const master = saju ? stems[saju.dayMaster] : null;
  const perspective = saju ? stemPerspectives[saju.dayMaster] : null;
  const month = saju?.pillars.find((p) => p.id === "month");
  const monthMaster = month ? stems[month.stem] : null;
  const sajuScenes =
    master && perspective
      ? [
          master.core,
          master.thinking,
          master.caution,
          perspective.emotion,
          master.thinking,
          perspective.conflict,
          master.relationships,
          master.relationships,
          master.love,
          master.love,
          perspective.emotion,
          perspective.conflict,
          master.thinking,
          master.work,
          monthMaster?.work || master.work,
          perspective.learning,
          master.money,
          perspective.learning,
          perspective.conflict,
          master.core,
        ]
      : [];
  // The MBTI branches are selected only from a supplied type, never inferred
  // from a day stem or an element count.
  const sections = storyTopics.map((topic, index) => {
    let detail = mbti
      ? topic.variants[
          ["I", "S", "T", "J"][topic.axis] === mbti.type[topic.axis] ? 0 : 1
        ]
      : sajuScenes[index];
    if (!mbti && index === 2 && master)
      detail = `반복해서 부딪히기 쉬운 지점은 ‘${master.caution}’입니다. 스스로 잘하고 있다고 느끼는 방식이 어떤 상황에서는 주변의 선택을 좁히거나 내 부담을 늘리는 방식이 될 수 있습니다.`;
    if (saju && mbti && [3, 11, 17].includes(index))
      detail += `\n\n${index === 3 ? perspective!.emotion : index === 11 ? perspective!.conflict : perspective!.learning}`;
    if (index === 14 && saju && monthMaster && month?.stem !== saju.dayMaster)
      detail += `\n\n밖에서 맡은 역할에서는 ${monthMaster.work} 스스로 편안한 방식과 밖에서 요구받는 방식이 다를 때, 능숙하게 해내면서도 유독 피곤한 일이 생깁니다.`;
    return {
      title: topic.title,
      body: `${topic.hooks[flavor]}\n\n${storyScenes[index]}\n\n${detail}\n\n${topic.turn}`,
    };
  });
  const titles: Record<Element, string> = {
    wood: "방향은 내가 정하는 사람",
    fire: "분위기를 만들지만 반응도 읽는 사람",
    earth: "친절하지만 만만하지 않은 사람",
    metal: "좋은 게 좋은 걸로는 안 되는 사람",
    water: "조용한데 머릿속은 시끄러운 사람",
  };
  return {
    ...original,
    storyVersion: STORY_VERSION,
    title: input.kind === "saju" ? titles[flavor] : original.title,
    summary: `${input.name}님, ${storyTopics[0].hooks[flavor]}\n\n${mbti ? storyTopics[0].variants[mbti.type[0] === "I" ? 0 : 1] : master!.core}\n\n${storyTopics[2].hooks[flavor]}`,
    subtitle: storyTopics[19].hooks[flavor].split(". ")[0] + ".",
    sections,
  };
}
