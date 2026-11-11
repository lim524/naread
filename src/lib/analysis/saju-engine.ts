import { calculateSaju } from "../saju";
import type { AnalysisInput } from "../types";
import type { Element, SajuAnalysis } from "./types";
import {
  seasonalContexts,
  stemPerspectives,
} from "../datasets/saju-perspectives";
import {
  branches,
  elements,
  elementOrder,
  relationDefinitions,
  sajuMeta,
  stems,
  tenGods,
} from "../datasets/saju";

export function analyzeSaju(input: AnalysisInput): SajuAnalysis {
  const chart = calculateSaju(input);
  const pillars = chart.details.map((p) => {
    const stem = stems[p.ganZhi[0]],
      branch = branches[p.ganZhi[1]];
    return {
      ...p,
      stem: p.ganZhi[0],
      branch: p.ganZhi[1],
      stemName: stem.name,
      branchName: branch.name,
      branchReading: {
        meaning: branch.meaning,
        detail: branch.detail,
        strength: branch.strength,
        caution: branch.caution,
      },
      element: stem.element,
      branchElement: branch.element,
      yinYang: stem.yinYang,
      tenGod: tenGods[p.tenGod]?.name || p.tenGod,
      hiddenTenGods: p.hiddenTenGods.map((g) => tenGods[g]?.name || g),
    };
  });
  const master = stems[chart.dayMaster];
  const perspective = stemPerspectives[chart.dayMaster];
  const monthStem = stems[pillars[1].stem];
  const monthGod = tenGods[chart.details[1].tenGod];
  const counts: Record<Element, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  const yinYang = { yin: 0, yang: 0 };
  const branchSequence = "子丑寅卯辰巳午未申酉戌亥";
  for (const p of pillars) {
    counts[p.element]++;
    counts[p.branchElement]++;
    yinYang[p.yinYang === "양" ? "yang" : "yin"]++;
    yinYang[branchSequence.indexOf(p.branch) % 2 === 0 ? "yang" : "yin"]++;
  }
  const rules: SajuAnalysis["rules"] = [
    {
      id: "day-master",
      label: "일간을 기준으로 읽기",
      evidence: `일주 ${chart.day}의 천간은 ${master.name}(${chart.dayMaster})입니다.`,
      interpretation: master.core,
    },
  ];
  for (const def of relationDefinitions) {
    const stemRelation = def.type === "천간합";
    for (let i = 0; i < pillars.length; i++)
      for (let j = i + 1; j < pillars.length; j++) {
        const a = stemRelation ? pillars[i].stem : pillars[i].branch;
        const b = stemRelation ? pillars[j].stem : pillars[j].branch;
        if (def.pairs.some((pair) => pair === a + b || pair === b + a))
          rules.push({
            id: `${def.type}-${pillars[i].id}-${pillars[j].id}`,
            label: def.type,
            evidence: `${pillars[i].label}의 ${a}와 ${pillars[j].label}의 ${b}`,
            interpretation: def.meaning,
          });
      }
  }
  const season = branches[pillars[1].branch].season;
  const countSummary = elementOrder
    .map((id) => `${elements[id].name} ${counts[id]}개`)
    .join(" · ");
  const godDescriptions = [
    ...new Set(
      chart.details.filter((p) => p.id !== "day").map((p) => p.tenGod),
    ),
  ]
    .map((g) => tenGods[g])
    .filter(Boolean);
  return {
    meta: sajuMeta,
    pillars,
    dayMaster: chart.dayMaster,
    dayMasterName: master.name,
    dayElement: master.element,
    counts,
    yinYang,
    season,
    rules,
    conventions: chart.conventions,
    warnings: chart.warnings,
    sections: [
      {
        title: "나의 사주 원국",
        body: `${pillars.map((p) => `${p.label} ${p.stemName}${p.branchName}(${p.ganZhi})`).join(" · ")}. 일간 ${master.name}${elements[master.element].name}을 중심으로, 월지 ${pillars[1].branchName}의 ${season} 환경과 다른 글자들의 관계를 함께 읽습니다.${input.unknownTime ? " 태어난 시간이 없어 시주는 제외했습니다." : ""}`,
        ruleId: "calendar-pillars",
      },
      {
        title: "일간과 기본 기질",
        body: `${master.name}(${chart.dayMaster}) · ${master.yinYang}의 ${elements[master.element].name}. ‘${master.symbol}’에 빗대어 읽는 기질입니다. ${master.core}`,
        ruleId: "day-master",
      },
      {
        title: "오행 구성",
        body: `${countSummary}. 천간과 지지에 드러난 오행의 분포입니다. 월지는 ${pillars[1].branchName}(${pillars[1].branch})이며 ${season}에 해당합니다. 개수와 별개로 계절의 바탕을 함께 봅니다. ${pillars[1].branchReading.meaning}.`,
        ruleId: "visible-element-counts",
      },
      {
        title: "성격과 사고방식",
        body: master.thinking,
        ruleId: "day-master",
      },
      {
        title: "감정을 받아들이고 표현하는 방식",
        body: perspective.emotion,
        ruleId: "day-master",
      },
      {
        title: "갈등이 생겼을 때의 반응",
        body: perspective.conflict,
        ruleId: "day-master",
      },
      {
        title: "배움과 문제 해결의 습관",
        body: perspective.learning,
        ruleId: "day-master",
      },
      {
        title: "강점과 주의할 점",
        body: `강점은 ${master.strength}입니다. 이 특성이 지나치게 작동할 때 함께 살필 지점은 ‘${master.caution}’입니다.`,
        ruleId: "day-master",
      },
      {
        title: "인간관계",
        body: master.relationships,
        ruleId: "ten-gods",
      },
      {
        title: "애정 표현과 친밀감",
        body: master.love,
        ruleId: "day-master",
      },
      {
        title: "직업 및 업무 성향",
        body: `${master.work} ${godDescriptions.map((g) => `${g.name}(${g.meaning})의 관점에서는 ${g.strength}에 주목합니다. ${g.caution}.`).join(" ")}`,
        ruleId: "ten-gods",
      },
      {
        title: "협업에서 드러나는 역할",
        body: `월간 ${pillars[1].stemName}(${pillars[1].stem})을 일간 ${master.name}(${chart.dayMaster})과 비교하면 ${pillars[1].tenGod} 관계입니다. ${monthGod ? `${monthGod.meaning} 이 관계에서 주목하는 모습은 ${monthGod.strength}입니다. 역할이 과해질 때 함께 살필 과제는 ‘${monthGod.caution}’입니다.` : ""} ${monthStem.work}`,
        ruleId: "ten-gods",
      },
      {
        title: "내적인 기준과 밖에서 보이는 모습",
        body: `자기 기준을 읽는 일간은 ${master.name}${elements[master.element].name}, 사회적 역할을 읽는 월간은 ${monthStem.name}${elements[monthStem.element].name}입니다. ${pillars[1].stem === chart.dayMaster ? `두 자리에 같은 글자가 있어 자신이 중요하게 여기는 방식과 밖에서 맡는 역할을 같은 이미지로 읽습니다. ${master.symbol}의 특성이 익숙한 관계와 공식적인 자리에서 함께 드러나는 구성이며, 기준을 유지하는 힘과 상황에 따라 방식을 바꾸는 유연함 사이가 해석의 초점입니다.` : `내면의 ‘${master.symbol}’과 바깥의 ‘${monthStem.symbol}’을 함께 가진 구성으로 읽습니다. ${monthStem.core} 한편 스스로 납득하고 선택하는 기준에서는 ${master.strength}에 무게가 실립니다. 밖에서 요구받는 역할을 잘 수행하더라도 자신이 편안하게 느끼는 방식과는 차이가 생길 수 있는 대목입니다.`}`,
        ruleId: "calendar-pillars",
      },
      {
        title: "태어난 계절과 활동의 리듬",
        body: `월지 ${pillars[1].branchName}(${pillars[1].branch})는 ${season}에 해당합니다. ${seasonalContexts[pillars[1].branchElement]} 일간 ${master.name}${elements[master.element].name}의 ${elements[master.element].keyword}이라는 중심 주제를 이 계절의 배경 위에서 함께 읽습니다.`,
        ruleId: "calendar-pillars",
      },
      {
        title: "재물과 소비 습관",
        body: master.money,
        ruleId: "day-master",
      },
      {
        title: "종합적인 사주 이야기",
        body: `${master.name}${elements[master.element].name}의 중심에는 ${master.strength}이 있습니다. 이 기질이 일에서는 ${monthStem.symbol}의 역할과 만나고, ${season}이라는 계절적 배경 속에서 표현됩니다. 강점을 오래 유지하기 위한 과제는 ‘${master.caution}’입니다. ${rules.some((rule) => rule.label === "지지충") ? "원국 안에는 서로 반대 방향을 나타내는 지지충도 있습니다. 한 방식만 유지하려는 흐름과 상황에 맞추어 전환하려는 흐름을 함께 살피는 구성입니다." : rules.some((rule) => rule.label === "천간합" || rule.label === "지지육합") ? "원국 안에 합의 관계가 있어 서로 다른 작용을 조율하고 연결하는 관점도 함께 읽습니다." : "일간의 기질과 월간의 역할을 나란히 보면 자신이 편안한 방식과 상황에서 요구받는 방식이 만나는 지점을 살필 수 있습니다."}`,
        ruleId: "chart-synthesis",
      },
    ],
  };
}
