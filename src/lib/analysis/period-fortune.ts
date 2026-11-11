import { Solar } from "lunar-typescript";
import type { SavedReading } from "../types";
import { control, generation, stems, elements } from "../datasets/saju";
import { DATASET_VERSION } from "../datasets/meta";
import { stemPerspectives } from "../datasets/saju-perspectives";
export type Period = "day" | "week" | "month" | "year";
export const fortuneVersion = `${DATASET_VERSION}-period-v1`;
export type PeriodInfo = {
  period: Period;
  start: string;
  end: string;
  anchor: string;
  label: string;
};
const iso = (d: Date) => d.toISOString().slice(0, 10);
export function periodInfo(period: Period, now = new Date()): PeriodInfo {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const d = new Date(`${date}T12:00:00Z`);
  const y = d.getUTCFullYear(),
    m = d.getUTCMonth();
  if (period === "day")
    return { period, start: date, end: date, anchor: date, label: date };
  if (period === "week") {
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const start = iso(d);
    d.setUTCDate(d.getUTCDate() + 6);
    return {
      period,
      start,
      end: iso(d),
      anchor: start,
      label: `${start} ~ ${iso(d)}`,
    };
  }
  if (period === "month")
    return {
      period,
      start: iso(new Date(Date.UTC(y, m, 1))),
      end: iso(new Date(Date.UTC(y, m + 1, 0))),
      anchor: iso(new Date(Date.UTC(y, m, 15))),
      label: `${y}년 ${m + 1}월`,
    };
  return {
    period,
    start: `${y}-01-01`,
    end: `${y}-12-31`,
    anchor: `${y}-07-01`,
    label: `${y}년`,
  };
}
type Theme = "peer" | "support" | "expression" | "resource" | "pressure";
const topics: Record<
  Theme,
  {
    name: string;
    context: string;
    work: string;
    money: string;
    relationship: string;
  }
> = {
  peer: {
    name: "내 기준과 다른 사람의 속도",
    context:
      "같은 방향으로 움직이는 사람과 협력할 여지가 있는 한편, 비슷한 역할을 두고 의견이 겹치는 장면을 주제로 읽습니다. 내 기준이 분명해질수록 상대 역시 자기 기준을 가지고 있다는 점에서 협력과 경쟁의 경계가 드러날 수 있습니다.",
    work: "주도권을 잡는 일과 실무를 맡는 일이 같은 사람에게 모이는지 살필 만한 흐름입니다. 같은 목표에 동의해도 완료 기준이 다르면 서로 일을 다시 손보는 시간이 늘 수 있습니다.",
    money:
      "함께 쓰는 비용과 개인 비용의 경계를 살피는 주제입니다. 비슷한 취향이나 친밀감이 지출 여력까지 같다는 뜻은 아니어서, 비교하며 고른 소비가 실제 필요와 달라지는 부분이 생길 수 있습니다.",
    relationship:
      "공감대가 빠르게 생겨도 모든 의견까지 같을 필요는 없습니다. 친밀해질수록 작은 차이를 배신처럼 느끼기보다 각자가 고른 우선순위로 볼 여지가 있는 흐름입니다.",
  },
  support: {
    name: "받아들이고 내 것으로 만드는 시간",
    context:
      "정보와 경험을 받아들여 기반을 쌓는 주제로 읽습니다. 충분히 이해하고 싶다는 마음이 도움이 되지만 준비가 늘어날수록 직접 선택하는 순간을 뒤로 미루기 쉬운 긴장도 있습니다.",
    work: "새 자료를 더 찾는 일과 이미 모은 정보를 적용하는 일이 나뉘는 지점입니다. 설명을 이해한 것과 실제로 해낼 수 있는 부분의 차이가 작게 시험해 보는 과정에서 드러나기 쉽습니다.",
    money:
      "배움과 편의를 위한 지출의 쓰임을 살피는 주제입니다. 앞으로 쓸 것이라는 기대와 이미 사용하고 있는 효용을 구분하면, 준비를 위해 모은 것 중 활용되지 않는 부분이 보일 수 있습니다.",
    relationship:
      "조언과 도움을 받아들이는 방식이 관계의 주제가 됩니다. 상대가 도움을 주고 싶어 하는 마음과 자신이 실제로 필요한 도움 사이에 차이가 있을 수 있습니다.",
  },
  expression: {
    name: "생각을 밖으로 옮기는 흐름",
    context:
      "안에 쌓인 생각을 말과 결과물로 드러내는 주제로 읽습니다. 표현한 만큼 반응이 즉시 돌아오지 않아도, 설명하는 과정에서 스스로 이해한 부분과 아직 빈 부분을 구별할 수 있습니다.",
    work: "완벽한 최종본을 기다리는 일보다 검토 가능한 결과를 만드는 과정에 초점을 둡니다. 초안의 역할과 완성본의 역할이 구분되면 다른 사람의 피드백이 평가보다 수정 자료로 들어오기 쉽습니다.",
    money:
      "취향을 드러내거나 무언가를 만드는 데 쓰는 비용을 살피는 주제입니다. 활동을 이어가는 데 필요한 비용과 시작한 기분을 얻기 위한 구매는 다른 만족으로 남을 수 있습니다.",
    relationship:
      "표현의 양과 전달의 정확성이 갈리는 장면을 주제로 읽습니다. 충분히 말했다고 느끼는 쪽과 무엇을 부탁받았는지 분명하지 않은 쪽 사이에 간극이 생길 수 있습니다.",
  },
  resource: {
    name: "확장할 것과 감당할 것의 구분",
    context:
      "활용할 자원과 실제 책임 범위를 구체화하는 주제로 읽습니다. 가능성이 보일 때 바로 더하기보다, 선택한 일을 지속하는 데 필요한 시간과 노력이 어디에서 나오는지가 중요해지는 흐름입니다.",
    work: "기회 자체보다 기회를 운영하는 비용이 주제가 됩니다. 새 업무의 시작은 짧아도 이후의 확인과 유지가 길어질 수 있어서, 눈에 보이는 결과와 뒤에서 필요한 역할이 다르게 남을 수 있습니다.",
    money:
      "수익 예측보다 보유한 자원과 반복되는 지출의 구조를 살피는 주제입니다. 한 번 감당할 수 있는 금액과 계속 유지할 수 있는 비용 사이에 차이가 있는 선택에 관심을 둘 만합니다.",
    relationship:
      "호의의 크기보다 오래 유지할 수 있는 약속이 주제가 됩니다. 한 번의 부탁을 받아들인 것이 반복되는 역할에 동의한 것으로 굳어지는 지점에서 기대 차이가 드러날 수 있습니다.",
  },
  pressure: {
    name: "역할과 경계를 다시 나누는 흐름",
    context:
      "요구받는 역할과 자신의 기준을 함께 살피는 주제로 읽습니다. 책임을 다하는 것이 모든 일을 직접 처리하는 것과 겹칠 때, 성실함이 자기 부담을 늘리는 방향으로 작동할 수 있습니다.",
    work: "일의 양보다 결정 권한과 책임의 범위가 맞는지가 주제가 됩니다. 결과에 대한 책임은 있는데 순서를 바꿀 권한이 없다면, 더 노력하는 문제와 역할을 조정하는 문제가 분리될 필요가 있습니다.",
    money:
      "고정된 의무 지출과 선택 가능한 소비의 경계를 살피는 주제입니다. 안전감을 위해 계속 추가한 항목이 오히려 생활의 여유를 줄이는 구조인지 확인할 여지가 있습니다.",
    relationship:
      "상대의 기대를 맞추는 역할과 자신의 의사를 드러내는 역할 사이의 균형이 주제가 됩니다. 거절을 관계 전체에 대한 거부로 받아들이는 상황에서는 작은 부탁도 큰 부담으로 느껴질 수 있습니다.",
  },
};
const scope: Record<Period, { opening: string; work: string; love: string }> = {
  day: {
    opening: "오늘 만나는 한 장면에 초점을 맞춥니다.",
    work: "오늘 완료할 작업 하나에서 착수와 완료를 가르는 조건을 살피는 관점입니다.",
    love: "오늘 주고받는 짧은 말이나 답장을 해석할 때, 평소의 맥락과 이번 상황의 차이를 함께 읽는 관점입니다.",
  },
  week: {
    opening: "이번 주에 반복되는 일정과 역할의 배분을 살펴봅니다.",
    work: "한 주의 시작에 정한 계획과 중간에 들어온 요청이 충돌하는 지점을 살핍니다. 일회성 예외가 다음 주에도 반복될 업무로 남는지가 주간의 초점입니다.",
    love: "함께할 시간을 정하는 방식과 일정이 바뀌었을 때의 반응을 살핍니다. 한 번의 연락보다 일주일 동안 이어지는 상호작용의 리듬이 주제입니다.",
  },
  month: {
    opening: "이번 달에 유지할 습관과 조정할 구조를 살펴봅니다.",
    work: "매번 발생하는 문제를 그때그때 처리하는 방식과 절차 자체를 바꾸는 방식을 비교합니다. 이번 달이 지나도 남을 수 있는 업무 구조를 살피는 관점입니다.",
    love: "시간을 함께 보낸 양과 서로 편안하게 참여한 정도를 나누어 봅니다. 반복되는 생활 습관에서 누가 늘 조정하고 있는지가 월간의 주제입니다.",
  },
  year: {
    opening: "올해의 장기 방향과 맡고 있는 역할의 지속성을 살펴봅니다.",
    work: "다음 일정의 성과보다 어떤 역할과 경험을 축적하고 싶은지에 초점을 둡니다. 지금 잘한다는 이유로 계속 맡는 역할과 앞으로 키우고 싶은 역할이 다른 지점이 연간의 주제입니다.",
    love: "관계를 어떤 형태로 유지하고 싶은지, 각자의 생활 변화와 함께 살펴보는 관점입니다. 만남의 빈도보다 앞으로 서로에게 기대하는 역할이 어떻게 달라지는지가 주제입니다.",
  },
};
export type PeriodFortune = {
  info: PeriodInfo;
  ganZhi: string;
  theme: string;
  sections: { title: string; body: string }[];
};
export function periodFortune(
  profile: SavedReading,
  info: PeriodInfo,
): PeriodFortune {
  if (profile.kind !== "comprehensive" || !profile.result.analysis)
    throw new Error("종합 분석을 먼저 완료해 주세요.");
  const b = profile.result.analysis;
  const [y, m, d] = info.anchor.split("-").map(Number);
  const lunar = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar();
  const ganZhi =
    info.period === "year"
      ? lunar.getYearInGanZhiByLiChun()
      : info.period === "month"
        ? lunar.getMonthInGanZhiExact()
        : lunar.getDayInGanZhi();
  function themeFor(pillar: string): Theme {
    if (!b.saju) return "support";
    const mine = b.saju.dayElement,
      current = stems[pillar[0]].element;
    return mine === current
      ? "peer"
      : generation[current] === mine
        ? "support"
        : generation[mine] === current
          ? "expression"
          : control[mine] === current
            ? "resource"
            : "pressure";
  }
  const theme = themeFor(ganZhi);
  const t = topics[theme],
    s = scope[info.period];
  const mbti = b.mbti?.type;
  const work = mbti
    ? mbti.endsWith("J")
      ? "계획과 완료 조건을 분명히 하고 싶은 선호가 더해집니다. 계획이 맞는지와 이미 정한 계획을 지키고 싶은 마음이 구분되는 지점입니다."
      : "새 정보에 맞추어 선택을 열어두려는 선호가 더해집니다. 유연하게 수정하는 것과 완료를 늦추는 것이 어디에서 갈리는지가 함께 주제입니다."
    : "";
  const relationships = mbti
    ? mbti[0] === "I"
      ? "혼자 정리하는 시간이 필요한 선호에서는 답이 늦는 이유가 상대에게 보이지 않을 수 있습니다."
      : "대화를 통해 생각이 정리되는 선호에서는 검토 중인 말이 상대에게 확정된 의견으로 들릴 수 있습니다."
    : "";
  const personal = b.saju
    ? `${b.saju.dayMasterName}${elements[b.saju.dayElement].name} 일간과 기간의 ${ganZhi}를 비교해 읽는 주제입니다.`
    : "사주 정보가 없어 기간의 간지와 개인 원국의 관계는 제외하고 저장한 성향과 기간별 주제를 읽습니다.";
  const parent = periodInfo("year", new Date(`${info.start}T12:00:00+09:00`));
  const [parentYear] = parent.anchor.split("-").map(Number);
  const annualPillar = Solar.fromYmdHms(parentYear, 7, 1, 12, 0, 0)
    .getLunar()
    .getYearInGanZhiByLiChun();
  const annualTheme = topics[themeFor(annualPillar)].name;
  const lineage =
    info.period === "year"
      ? `올해의 중심 주제는 ‘${t.name}’입니다.`
      : `${parent.label}의 ‘${annualTheme}’이라는 큰 주제 안에서 이번 기간은 ‘${t.name}’에 초점을 맞춥니다.`;
  return {
    info,
    ganZhi,
    theme: t.name,
    sections: [
      {
        title: "전체 흐름",
        body: `${s.opening} ${personal} ${lineage} ${t.context}`,
      },
      {
        title: "학업·업무",
        body: `${s.work} ${t.work} ${work} ${b.saju ? stemPerspectives[b.saju.dayMaster].learning : ""}`,
      },
      { title: "재물·생활 관리", body: t.money },
      {
        title: "애정·가까운 관계",
        body: `${s.love} ${mbti ? (mbti[2] === "T" ? "이유가 설명되고 약속이 행동으로 이어질 때 신뢰를 확인하려는 선호가 더해집니다." : "선택 과정에 자신의 마음이 고려되었는지를 통해 관계를 확인하려는 선호가 더해집니다.") : ""}`,
      },
      {
        title: "인간관계",
        body: `${t.relationship} ${relationships} ${b.saju ? stemPerspectives[b.saju.dayMaster].conflict : ""}`,
      },
      {
        title: "나의 프로필과 연결하기",
        body: `${profile.result.title} · ${b.dream?.symbols[0] ? `${b.dream.symbols[0].name}의 ‘${b.dream.symbols[0].meaning}’ 이미지는 나의 방향을 돌아보는 상징으로 함께 읽습니다.` : "저장한 종합 결과의 중심 기질과 함께 읽습니다."} ${parent.label}의 큰 방향 안에서 ${info.period === "year" ? "반복해서 맡는 역할과 앞으로 키울 역할의 차이" : "이번 기간에 실제로 반복되는 선택"}을 살펴보는 구성입니다.`,
      },
    ],
  };
}
