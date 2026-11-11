import type { AnalysisBundle, Element } from "./types";
import type { AnalysisInput, Reading } from "../types";
import { stems, elements } from "../datasets/saju";
import { connectionPrompts } from "../datasets/connections";
import { stemPerspectives } from "../datasets/saju-perspectives";

const tensions: Record<Element, { J: string; P: string }> = {
  wood: {
    J: "성장할 방향을 정한 뒤에는 계획을 지키는 것이 목표를 지키는 일처럼 느껴질 수 있습니다. 목적을 유지하는 것과 처음 정한 방법을 유지하는 것이 겹칠 때, 환경이 바뀌어도 수정을 늦추는 긴장이 생길 수 있어요.",
    P: "더 나은 경로를 찾는 관심과 선택지를 열어두는 선호가 만나면 시작할 수 있는 일이 계속 늘어날 수 있습니다. 새 가능성이 나타날 때 현재 작업을 확장할지, 다음 작업으로 남길지의 구분이 결과물의 크기를 좌우하기 쉬워요.",
  },
  fire: {
    J: "생각을 밖에 드러내는 흐름에 일정과 마감의 기준이 더해지면 설명과 실행을 함께 이끄는 모습으로 읽을 수 있습니다. 다만 공개한 계획이 약속처럼 굳으면 충분히 검토하기 전에 결론을 유지하려는 부담이 생길 수 있어요.",
    P: "표현을 통해 반응을 얻는 흐름과 현장에서 방식을 바꾸는 선호가 만납니다. 대화는 생동감 있게 이어질 수 있지만, 대화 중 나온 아이디어와 실제 확정된 약속을 상대가 다르게 기억하는 지점이 생길 수 있습니다.",
  },
  earth: {
    J: "기반을 유지하는 관심과 예측 가능한 순서를 선호하는 태도가 함께 놓입니다. 맡은 일을 빠뜨리지 않는 힘이 되지만, 빈틈을 메우기 위해 정한 규칙이 늘어날수록 자신의 작업량도 함께 늘 수 있습니다.",
    P: "안정된 바탕을 챙기는 해석과 상황에 따라 움직이는 선호가 나란히 놓입니다. 지키고 싶은 것은 생활의 편안함이고 바꿀 수 있는 것은 그 방법일 수 있어요. 주변에서는 평소의 유연함만 보고 추가 요청도 쉽게 받아줄 것이라 기대하는 간극이 생길 수 있습니다.",
  },
  metal: {
    J: "선별 기준과 마무리 시점을 분명히 하려는 두 흐름이 만납니다. 결과의 책임 범위를 정하기 쉬운 반면, 아직 생각 중인 사람에게는 결정이 너무 빨리 끝난 것처럼 보일 수 있어요. 판단의 정확성과 협의의 속도가 서로 다른 문제가 되는 조합입니다.",
    P: "분명한 기준을 원하는 해석과 새로운 정보에 맞추어 선택을 바꾸는 선호가 함께 있습니다. 기준이 없어서 결정을 미루기보다 더 잘 맞는 기준을 계속 찾는 모습으로 읽을 수 있어요. 검토의 질은 높아져도 완료 시점이 뒤로 밀리는 긴장이 생길 수 있습니다.",
  },
  water: {
    J: "정보를 깊게 모으는 흐름에 정리와 확정의 선호가 더해집니다. 준비한 내용을 구조로 만드는 데 관심이 가지만, 계획에 맞지 않는 새 정보가 나타나면 자료를 더 모을지 일정을 지킬지 갈등하기 쉬워요.",
    P: "넓게 탐색하는 해석과 가능성을 닫지 않는 선호가 만납니다. 여러 맥락을 연결하는 과정은 풍부해지지만, 질문 하나가 다음 질문으로 이어져 현재의 답을 내놓는 시점이 흐려질 수 있어요. 탐색의 종료와 생각의 종료를 같은 것으로 느끼는 지점이 긴장으로 남을 수 있습니다.",
  },
};
const social = {
  I: "반응을 바로 보여주기보다 안에서 정리한 뒤 설명하는 선호가 더해집니다. 상대는 아직 생각 중이라는 신호를 못 받고 관심이 없다고 받아들일 수 있어, 겉으로 보이는 반응의 크기와 실제 관여의 깊이가 다르게 보이는 지점입니다.",
  E: "대화하며 생각을 구체화하는 선호가 더해집니다. 말하는 동안 바뀐 생각을 상대는 최종 결정으로 받아들일 수 있고, 본인은 검토 중인 말을 했다고 느낄 수 있어요. 아이디어를 나누는 대화와 약속을 정하는 대화 사이에 차이가 생기기 쉽습니다.",
};
const judgment = {
  T: "판단을 설명할 때 공통으로 적용할 수 있는 이유와 기준을 앞세우는 선호입니다. 해결책을 정리하는 속도에 비해 상대가 감정을 정리하는 속도는 느릴 수 있고, 문제에 대한 평가가 사람에 대한 평가로 들리는 부분에서 오해가 생길 수 있습니다.",
  F: "판단할 때 선택의 의미와 사람에게 남는 영향을 함께 고려하는 선호입니다. 모두가 납득할 결론을 찾는 동안 자신의 조건은 뒤로 밀릴 수 있어요. 상대의 사정을 이해한 것과 그 부담을 맡기로 한 것이 다를 때 관계의 경계가 중요한 주제가 됩니다.",
};
export function compositeReading(
  input: AnalysisInput,
  bundle: AnalysisBundle,
): Omit<Reading, "analysis"> {
  const { saju, mbti, dream } = bundle;
  const master = saju ? stems[saju.dayMaster] : null;
  const symbol = dream?.symbols[0];
  const role = mbti
    ? mbti.type.includes("NT")
      ? "탐구자"
      : mbti.type.includes("NF")
        ? "연결자"
        : mbti.type.endsWith("J")
          ? "설계자"
          : "발견자"
    : "관찰자";
  const motif = symbol
    ? symbol.id === "dragon" &&
      dream?.attributes.some((a) => a.id === "black" && a.symbolId === "dragon")
      ? "흑룡"
      : symbol.name
    : master?.symbol || mbti?.type || "나";
  const title = `${motif}의 ${role}`;
  const sections: Reading["sections"] = [];
  if (saju && master)
    sections.push({
      title: "나의 중심 기질",
      body: `${saju.dayMasterName}${elements[saju.dayElement].name}의 일간과 ${saju.season}의 월지를 함께 읽습니다. ${master.core}`,
    });
  if (saju && mbti && master) {
    const e = saju.dayElement;
    sections.push(
      {
        title: "생각을 모으고 판단하는 방식",
        body: `${connectionPrompts[e][mbti.letters[1]]}을 중심 장면으로 읽을 수 있습니다. ${mbti.type[1] === "N" ? "이미 확인된 사실에서도 다음에 무엇이 가능할지를 떠올리는 선호가 더해집니다. 아직 해보지 않은 방법을 설명할 때에는 현재의 근거와 앞으로의 가정이 같은 확신으로 전달되기 쉬워요." : "실제 사례와 확인할 수 있는 차이를 통해 판단하는 선호가 더해집니다. 익숙한 경험이 출발점이 되는 만큼, 이전 상황과 지금 상황에서 달라진 조건을 발견하는 순간에 생각의 방향도 바뀔 수 있습니다."} ${master.thinking}`,
      },
      {
        title: "사람을 만날 때 드러나는 모습",
        body: `${master.relationships} ${social[mbti.type[0] as keyof typeof social]}`,
      },
      {
        title: "감정과 갈등이 만나는 지점",
        body: `${stemPerspectives[saju.dayMaster].emotion} ${judgment[mbti.type[2] as keyof typeof judgment]}`,
      },
      {
        title: "일을 시작하고 끝내는 방식",
        body: `${master.work} ${tensions[e][mbti.type[3] as "J" | "P"]}`,
      },
      {
        title: "가까운 관계에서 원하는 것",
        body: `${master.love} ${mbti.type[2] === "T" ? "기준이 설명되고 약속이 실제 행동으로 이어질 때 신뢰를 확인하는 관점과 연결됩니다. 상대는 마음을 표현했다고 느껴도 자신에게는 무엇이 달라지는지 불분명하게 남을 수 있습니다." : "선택에 자신의 마음이 고려되었는지를 통해 관계를 확인하는 관점과 연결됩니다. 실용적인 도움을 받더라도 그 과정에서 자신의 의사를 묻지 않았다면 배려와 통제를 다르게 느낄 수 있습니다."}`,
      },
    );
  } else if (mbti) {
    sections.push(
      { title: "나의 성향", body: `${mbti.type} · ${mbti.summary}` },
      ...mbti.sections.slice(0, 3),
    );
  } else if (saju) sections.push(...saju.sections.slice(3, 7));
  if (symbol)
    sections.push({
      title: "태몽이 더하는 이야기",
      body: `${symbol.name}은 ‘${symbol.meaning}’의 상징으로 읽습니다. ${master ? `사주의 ‘${master.symbol}’이라는 기질적 이미지에 ` : ""}${mbti ? `${mbti.type}의 선호를 나란히 놓고, ` : ""}이 상징을 삶에서 중요하게 여기는 방향에 대한 비유로 더합니다. ${dream?.combinations.length ? dream.combinations.map((c) => `${c.label}: ${c.interpretation}`).join(" ") : "꿈에서 확인한 소재의 의미를 중심으로 읽으며, 등장한 상징을 실제 능력이나 성격의 증거로 사용하지 않습니다."}`,
    });
  if (!saju && !mbti && dream) sections.push(...dream.sections.slice(0, 3));
  sections.push({
    title: "서로 다른 면을 함께 읽기",
    body: `${master ? `사주에서 읽는 중심은 ${master.strength}입니다. ` : ""}${mbti ? `${mbti.type}는 이 특성이 일상에서 어떤 판단과 대화 방식으로 표현될 수 있는지를 비교하는 관점입니다. ` : ""}${symbol ? `${symbol.name}의 이미지는 이 프로필의 상징과 제목에 반영했습니다. ` : ""}${bundle.missing.length ? "입력하지 않았거나 확인할 수 없는 항목은 이번 프로필에서 제외했습니다." : "세 항목이 같은 사실을 입증한다고 합치기보다, 함께 두드러지는 면과 서로 속도가 다른 면을 구분해 읽었습니다."}`,
  });
  return {
    title,
    subtitle: master
      ? `${master.strength}을 중심으로 ${mbti?.type || "나의 기질"}${symbol ? `와 ${symbol.name}의 상징` : ""}을 함께 읽은 프로필`
      : mbti?.summary ||
        `${symbol?.name || "기억"}의 상징으로 읽는 나의 이야기`,
    summary: `${input.name}님의 종합 프로필은 ${[saju && `${saju.dayMasterName}${elements[saju.dayElement].name} 일간`, mbti?.type, symbol && `${symbol.name}의 태몽`].filter(Boolean).join(" · ")}을 바탕으로 합니다. ${master?.core || mbti?.summary || symbol?.meaning || ""}`,
    keywords: [
      mbti?.type,
      saju && `${saju.dayMasterName}${elements[saju.dayElement].name}`,
      symbol?.name,
    ].filter((s): s is string => !!s),
    sections,
    advice: "",
  };
}
