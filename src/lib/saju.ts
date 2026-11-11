import { Solar, Lunar } from "lunar-typescript";
import type { AnalysisInput } from "./types";
import { stems, generation, control } from "./datasets/saju";
function tenGod(day: string, other: string) {
  const a = stems[day],
    b = stems[other],
    samePolarity = a.yinYang === b.yinYang;
  if (a.element === b.element) return samePolarity ? "比肩" : "劫财";
  if (generation[a.element] === b.element)
    return samePolarity ? "食神" : "伤官";
  if (control[a.element] === b.element) return samePolarity ? "偏财" : "正财";
  if (control[b.element] === a.element) return samePolarity ? "七杀" : "正官";
  return samePolarity ? "偏印" : "正印";
}
export function calculateSaju(input: AnalysisInput) {
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const [h, min] = (input.unknownTime ? "12:00" : input.birthTime)
    .split(":")
    .map(Number);
  const lunar =
    input.calendar === "lunar"
      ? Lunar.fromYmdHms(y, input.leapMonth ? -m : m, d, h, min, 0)
      : Solar.fromYmdHms(y, m, d, h, min, 0).getLunar();
  const e = lunar.getEightChar();
  e.setSect(2);
  // The library's astronomical terms are expressed in UTC+8. Compare those
  // terms against the same instant in UTC+8, retaining KST for day/hour pillars.
  const termChart = lunar.getSolar().nextHour(-1).getLunar().getEightChar();
  termChart.setSect(2);
  const monthTerms = new Set([
    "立春",
    "惊蛰",
    "清明",
    "立夏",
    "芒种",
    "小暑",
    "立秋",
    "白露",
    "寒露",
    "立冬",
    "大雪",
    "小寒",
  ]);
  const boundaryUncertain =
    input.unknownTime &&
    Object.entries(lunar.getJieQiTable()).some(
      ([name, value]) =>
        monthTerms.has(name) &&
        value.nextHour(1).toYmd() === lunar.getSolar().toYmd(),
    );
  const details = [
    {
      id: "year" as const,
      label: "연주",
      ganZhi: termChart.getYear(),
      hiddenStems: termChart.getYearHideGan(),
      tenGod: e.getYearShiShenGan(),
      hiddenTenGods: e.getYearShiShenZhi(),
    },
    {
      id: "month" as const,
      label: "월주",
      ganZhi: termChart.getMonth(),
      hiddenStems: termChart.getMonthHideGan(),
      tenGod: e.getMonthShiShenGan(),
      hiddenTenGods: e.getMonthShiShenZhi(),
    },
    {
      id: "day" as const,
      label: "일주",
      ganZhi: e.getDay(),
      hiddenStems: e.getDayHideGan(),
      tenGod: e.getDayShiShenGan(),
      hiddenTenGods: e.getDayShiShenZhi(),
    },
    ...(!input.unknownTime
      ? [
          {
            id: "time" as const,
            label: "시주",
            ganZhi: e.getTime(),
            hiddenStems: e.getTimeHideGan(),
            tenGod: e.getTimeShiShenGan(),
            hiddenTenGods: e.getTimeShiShenZhi(),
          },
        ]
      : []),
  ].map((p) => ({
    ...p,
    tenGod: p.id === "day" ? "日主" : tenGod(e.getDayGan(), p.ganZhi[0]),
    hiddenTenGods: p.hiddenStems.map((g) => tenGod(e.getDayGan(), g)),
  }));
  return {
    year: termChart.getYear(),
    month: termChart.getMonth(),
    day: e.getDay(),
    time: input.unknownTime ? null : e.getTime(),
    dayMaster: e.getDayGan(),
    elements: {
      year: termChart.getYearWuXing(),
      month: termChart.getMonthWuXing(),
      day: e.getDayWuXing(),
      time: input.unknownTime ? null : e.getTimeWuXing(),
    },
    timezone: "Asia/Seoul",
    unknownTime: input.unknownTime,
    details,
    warnings: boundaryUncertain
      ? [
          "출생시간을 모르며 절입 당일에 해당합니다. 표시된 연주·월주와 해당 글자의 관계·계절·개수는 정오 기준의 참고값으로 확정할 수 없습니다. 일간은 날짜 기준으로 읽고, 정확한 연월주는 출생 시각을 확인한 뒤 다시 살펴주세요.",
        ]
      : [],
    conventions: [
      "출생 시각은 Asia/Seoul의 입력 시계 시각으로 해석합니다. 진태양시·역사적 서머타임·출생지 경도 보정은 적용하지 않습니다.",
      "연주는 입춘, 월주는 절입 시각을 기준으로 계산합니다. 라이브러리의 UTC+8 절기 시각을 한국 표준시 UTC+9와 같은 순간으로 비교하며, 음력 월 번호를 그대로 월주로 사용하지 않습니다.",
      "일주 경계는 자정으로 설정합니다(lunar-typescript sect=2). 23시 이후를 다음 날 일주로 바꾸는 방식과 차이가 있습니다.",
      "시간 미상은 정오를 기준으로 날짜와 연월주를 계산하며 시주·시간 오행·시주 관계는 제외합니다. 절입 당일이라면 실제 출생 시각에 따라 연월주가 달라질 수 있어 별도 확인이 필요합니다.",
      "음력은 lunar-typescript의 중국 역법을 사용합니다. 한국 공식 음력과 차이가 나는 날짜가 있을 수 있어 중요한 날짜는 양력으로 확인해 주세요.",
    ],
    note: "한국 표준시 기준, 진태양시 보정 미적용. 시간 미상은 시주를 해석하지 않음. 전통 해석은 과학적 예측이 아님.",
  };
}
