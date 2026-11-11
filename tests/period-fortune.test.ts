import { test } from "node:test";
import assert from "node:assert/strict";
import { periodInfo, periodFortune } from "../src/lib/analysis/period-fortune";
import { datasetReading } from "../src/lib/analysis/engine";
import { inputSchema } from "../src/lib/core";
import type { SavedReading } from "../src/lib/types";
const input = inputSchema.parse({
  kind: "comprehensive",
  name: "테스트",
  birthDate: "1995-05-21",
  unknownTime: true,
  mbti: "INTP",
  dream: "검은 용이 하늘로 올라가는 꿈",
});
const profile: SavedReading = {
  id: "local-test",
  kind: "comprehensive",
  input,
  result: datasetReading(input),
  created_at: "2026-11-11T00:00:00Z",
};
test("운세 기간은 한국 자정과 월요일·윤년·연도 경계를 따른다", () => {
  assert.equal(
    periodInfo("day", new Date("2026-11-10T14:59:59Z")).start,
    "2026-11-10",
  );
  assert.equal(
    periodInfo("day", new Date("2026-11-10T15:00:00Z")).start,
    "2026-11-11",
  );
  const week = periodInfo("week", new Date("2027-01-01T00:00:00Z"));
  assert.equal(week.start, "2026-12-28");
  assert.equal(week.end, "2027-01-03");
  assert.equal(
    periodInfo("month", new Date("2028-02-20T00:00:00Z")).end,
    "2028-02-29",
  );
  assert.equal(
    periodInfo("year", new Date("2026-12-31T15:00:00Z")).start,
    "2027-01-01",
  );
});
test("같은 프로필과 기간은 결과가 같고 네 기간의 내용은 구분된다", () => {
  const first = periodInfo("week", new Date("2026-11-09T04:00:00Z"));
  const last = periodInfo("week", new Date("2026-11-15T04:00:00Z"));
  assert.deepEqual(periodFortune(profile, first), periodFortune(profile, last));
  const bodies = (["day", "week", "month", "year"] as const).map(
    (period) =>
      periodFortune(
        profile,
        periodInfo(period, new Date("2026-11-11T04:00:00Z")),
      ).sections[0].body,
  );
  assert.equal(new Set(bodies).size, 4);
  const otherInput = { ...input, mbti: "ESFJ" };
  const other = {
    ...profile,
    input: otherInput,
    result: datasetReading(otherInput),
  };
  assert.notDeepEqual(
    periodFortune(profile, first).sections,
    periodFortune(other, first).sections,
  );
});
test("종합을 하지 않은 결과는 거절하고 누락된 사주는 만들어내지 않는다", () => {
  assert.throws(
    () => periodFortune({ ...profile, kind: "saju" }, periodInfo("day")),
    /종합 분석/,
  );
  const partial = inputSchema.parse({ ...input, unknownSaju: true });
  const fortune = periodFortune(
    { ...profile, input: partial, result: datasetReading(partial) },
    periodInfo("month"),
  );
  assert.match(fortune.sections[0].body, /사주 정보가 없어/);
});
test("종합 결과는 단순 나열 대신 조합 문단과 태몽 이미지를 제공한다", () => {
  assert.equal(profile.result.title, "흑룡의 탐구자");
  assert.ok(
    profile.result.sections.some((s) =>
      s.title.startsWith("싸울 때 쓰는 무기"),
    ),
  );
  assert.match(profile.result.analysis!.image.src, /dragon/);
  assert.ok(profile.result.sections.every((s) => s.body.length > 50));
});
