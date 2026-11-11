import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { Solar, Lunar } from "lunar-typescript";
import { inputSchema, fortuneSchema } from "../src/lib/core";
import { calculateSaju } from "../src/lib/saju";
import { analyzeInput, datasetReading } from "../src/lib/analysis/engine";
import { analyzeSaju } from "../src/lib/analysis/saju-engine";
import { analyzeMbti } from "../src/lib/analysis/mbti-engine";
import { parseDream } from "../src/lib/analysis/dream-parser";
import { matchDreamImage } from "../src/lib/analysis/dream-image-matcher";
import { datasetFortune } from "../src/lib/analysis/daily-fortune";
import {
  synthesisSchema,
  verifySynthesis,
} from "../src/lib/analysis/synthesis-contract";
import { sample } from "../src/lib/sample";
import { mbtiProfiles, preferences } from "../src/lib/datasets/mbti";
import { dreamSymbols } from "../src/lib/datasets/dream";
import { stemPerspectives } from "../src/lib/datasets/saju-perspectives";
import { stems } from "../src/lib/datasets/saju";
const base = {
  kind: "comprehensive" as const,
  name: "테스트",
  birthDate: "1995-05-21",
  birthTime: "14:30",
  unknownTime: false,
  calendar: "solar" as const,
  leapMonth: false,
  mbti: "INTP",
  dream: "검은 용이 하늘로 올라가는 꿈을 보았어요.",
};

test("모든 일간의 감정·갈등·학습 해석은 서로 다른 내용을 가진다", () => {
  for (const aspect of ["emotion", "conflict", "learning"] as const) {
    const readings = Object.keys(stems).map(
      (stem) => stemPerspectives[stem][aspect],
    );
    assert.equal(new Set(readings).size, 10);
    assert.ok(readings.every((body) => body.length > 100));
  }
});

test("같은 일간도 월간·계절에 따라 다른 원국 해석을 제공한다", () => {
  const a = analyzeSaju({ ...base, kind: "saju", birthDate: "1995-05-21" });
  const b = analyzeSaju({ ...base, kind: "saju", birthDate: "1995-07-20" });
  assert.equal(a.dayMaster, b.dayMaster);
  assert.equal(a.sections.length, 16);
  for (const title of [
    "협업에서 드러나는 역할",
    "내적인 기준과 밖에서 보이는 모습",
    "태어난 계절과 활동의 리듬",
  ]) {
    const first = a.sections.find((s) => s.title === title)!;
    const second = b.sections.find((s) => s.title === title)!;
    assert.notEqual(first.body, second.body);
  }
});
test("역법 예시의 원국과 양력·음력·윤달의 동일 날짜를 확인한다", () => {
  const s = calculateSaju({
    ...base,
    birthDate: "2005-12-23",
    birthTime: "08:37",
  });
  assert.deepEqual(
    [s.year, s.month, s.day, s.time],
    ["乙酉", "戊子", "辛巳", "壬辰"],
  );
  const leap = calculateSaju({
    ...base,
    calendar: "lunar",
    birthDate: "2023-02-01",
    leapMonth: true,
  });
  const solar = calculateSaju({ ...base, birthDate: "2023-03-22" });
  assert.deepEqual(
    [leap.year, leap.month, leap.day, leap.time],
    [solar.year, solar.month, solar.day, solar.time],
  );
  const lunar = Solar.fromYmdHms(1995, 5, 21, 14, 30, 0).getLunar();
  assert.equal(
    calculateSaju({
      ...base,
      calendar: "lunar",
      birthDate: `${lunar.getYear()}-${String(Math.abs(lunar.getMonth())).padStart(2, "0")}-${String(lunar.getDay()).padStart(2, "0")}`,
      leapMonth: lunar.getMonth() < 0,
    }).day,
    calculateSaju(base).day,
  );
  assert.equal(
    inputSchema.safeParse({
      ...base,
      calendar: "lunar",
      birthDate: "2023-02-01",
      leapMonth: true,
    }).success,
    true,
  );
  assert.equal(
    inputSchema.safeParse({
      ...base,
      calendar: "lunar",
      birthDate: "2024-02-01",
      leapMonth: true,
    }).success,
    false,
  );
});
test("절입 전후의 월주와 자정 일주 경계를 명시한 방식으로 계산한다", () => {
  const before = calculateSaju({
    ...base,
    birthDate: "2026-02-03",
    birthTime: "12:00",
  });
  const after = calculateSaju({
    ...base,
    birthDate: "2026-02-05",
    birthTime: "12:00",
  });
  assert.notEqual(before.year, after.year);
  assert.notEqual(before.month, after.month);
  assert.equal(
    calculateSaju({ ...base, birthTime: "23:30" }).day,
    calculateSaju({ ...base, birthTime: "22:30" }).day,
  );
  assert.notEqual(
    calculateSaju({ ...base, birthDate: "1995-05-22", birthTime: "00:01" }).day,
    calculateSaju({ ...base, birthTime: "23:59" }).day,
  );
  const boundary = Lunar.fromYmdHms(2026, 1, 1, 12, 0, 0).getJieQiTable()[
    "立春"
  ];
  assert.ok(boundary); // Library's exact term is discoverable, not an invented fixed day.
  const atLibraryClock = calculateSaju({
    ...base,
    birthDate: boundary.toYmd(),
    birthTime: `${String(boundary.getHour()).padStart(2, "0")}:${String(boundary.getMinute()).padStart(2, "0")}`,
  });
  const afterKstTerm = boundary.nextHour(2);
  const atKstClock = calculateSaju({
    ...base,
    birthDate: afterKstTerm.toYmd(),
    birthTime: `${String(afterKstTerm.getHour()).padStart(2, "0")}:${String(afterKstTerm.getMinute()).padStart(2, "0")}`,
  });
  assert.notEqual(
    atLibraryClock.month,
    atKstClock.month,
    "절입 비교는 중국 시계가 아니라 한국 시각으로 변환해야 한다",
  );
});
test("시간 미상은 세 기둥·여섯 글자만 세고 지장간은 별도 표시한다", () => {
  const s = analyzeSaju({ ...base, unknownTime: true, birthTime: "" });
  assert.equal(s.pillars.length, 3);
  assert.equal(
    Object.values(s.counts).reduce((a, b) => a + b, 0),
    6,
  );
  assert.equal(s.yinYang.yin + s.yinYang.yang, 6);
  assert.equal(
    s.pillars.some((p) => p.id === "time"),
    false,
  );
  assert.ok(s.pillars.every((p) => p.hiddenStems.length > 0 && p.tenGod));
  assert.ok(
    s.pillars.every(
      (p) =>
        p.branchReading &&
        p.branchReading.detail.length > 100 &&
        p.branchReading.strength &&
        p.branchReading.caution,
    ),
  );
  assert.equal(
    s.rules.some((r) => r.id.includes("time")),
    false,
  );
});
test("16유형 모두 독립적인 16개 본문과 생활 예시를 가진다", () => {
  assert.equal(Object.keys(mbtiProfiles).length, 16);
  const all = new Set<string>();
  for (const [type, p] of Object.entries(mbtiProfiles)) {
    assert.match(type, /^[EI][SN][TF][JP]$/);
    assert.equal(p.paragraphs.length, 16);
    assert.ok(p.scenes.length);
    assert.ok(
      [p.summary, ...p.paragraphs, ...p.scenes.map((s) => s.body)].join("")
        .length >= 3000,
      `${type}: 3,000자 이상`,
    );
    for (const body of p.paragraphs) {
      assert.ok(body.length >= 100, `${type} 본문 분량`);
      assert.equal(all.has(body), false, `${type} 중복 본문`);
      all.add(body);
    }
    assert.equal(analyzeMbti(type).letters.length, 4);
  }
  assert.equal(Object.keys(preferences).length, 8);
  assert.throws(() => analyzeMbti("XXXX"));
  assert.equal(
    analyzeMbti("INTP", "quick-reflection").source,
    "quick-reflection",
  );
});
test("태몽은 동의어·색·부정·주체와 대상을 구분한다", () => {
  const s = parseDream(
    "커다란 검은 용이 반짝이는 여의주를 물고 엄마 뱃속으로 들어왔다.",
  );
  assert.ok(s.symbols.some((s) => s.id === "dragon"));
  assert.ok(s.symbols.some((s) => s.id === "pearl"));
  assert.ok(
    s.attributes.some((a) => a.id === "black" && a.symbolId === "dragon"),
  );
  assert.deepEqual(
    parseDream("용이 나를 잡았다.").events.find((e) => e.actionId === "catch")
      ?.actor,
    "용",
  );
  assert.deepEqual(
    parseDream("내가 용을 잡았다.").events.find((e) => e.actionId === "catch")
      ?.target,
    "용",
  );
  assert.equal(
    parseDream("용을 잡았다.").events.find((e) => e.actionId === "catch")
      ?.actor,
    null,
  );
  assert.equal(
    parseDream("용이 없었다. 호랑이가 있었다.").symbols.some(
      (s) => s.id === "dragon",
    ),
    false,
  );
  assert.ok(
    parseDream("복숭아를 먹지 않았다.").events.find((e) => e.actionId === "eat")
      ?.negated,
  );
  assert.equal(parseDream("복숭아를 먹지 않았다.").combinations.length, 0);
  assert.equal(
    parseDream("나는 말을 했다. 사과했다.").symbols.some((s) =>
      ["horse", "apple"].includes(s.id),
    ),
    false,
  );
});
test("태몽 조합은 명확한 관계에서만 적용하며 확인 내용을 반영한다", () => {
  const known = parseDream("용이 여의주를 물고 있었다.");
  assert.ok(known.combinations.some((c) => c.id === "dragon-pearl"));
  assert.equal(known.image.matchedBy, "combination");
  assert.equal(
    parseDream("흰 용이 여의주를 물고 있었다.").image.illustrationId,
    "dragon-metal",
  );
  assert.equal(
    parseDream("용과 여의주를 보았다.").combinations.some(
      (c) => c.id === "dragon-pearl",
    ),
    false,
  );
  const corrected = parseDream("용이 나를 잡았다.", {
    symbolIds: ["tiger"],
    events: [
      { actionId: "catch", actor: "나", target: "호랑이", negated: false },
    ],
  });
  assert.equal(corrected.symbols[0].id, "tiger");
  assert.equal(corrected.events[0].actor, "나");
  assert.throws(() =>
    parseDream(base.dream, { symbolIds: ["not-registered"] }),
  );
  assert.throws(() => parseDream(base.dream, { symbolIds: ["constructor"] }));
  assert.equal(
    parseDream("용이 있었다. 돼지가 여의주를 물었다.").combinations.length,
    0,
  );
  assert.equal(parseDream("여의주가 용을 물었다.").combinations.length, 0);
  assert.equal(
    parseDream(base.dream, { symbolIds: ["dragon"], attributes: [] }).attributes
      .length,
    0,
  );
  const unknown = parseDream("오카피가 우주선을 끌고 왔다.");
  assert.equal(unknown.symbols.length, 0);
  assert.ok(unknown.needsConfirmation);
});
test("모든 등록된 태몽 소재와 기본 이미지가 실제 파일을 참조한다", () => {
  assert.ok(dreamSymbols.length >= 30);
  for (const symbol of dreamSymbols) {
    const matched = matchDreamImage([symbol.id], []);
    assert.ok(
      existsSync("public" + matched.src),
      `${symbol.name}: ${matched.src}`,
    );
  }
  assert.ok(existsSync("public" + matchDreamImage([], []).src));
  assert.equal(
    matchDreamImage(["dragon"], [{ id: "black", symbolId: "dragon" }])
      .illustrationId,
    "dragon-water",
  );
});
test("개별 분석은 외부 호출 없이 끝나고 AI에는 불필요한 원본 개인정보를 보내지 않는다", () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (() => {
    calls++;
    throw Error("외부 요청 금지");
  }) as typeof fetch;
  try {
    for (const kind of ["saju", "mbti", "dream"] as const) {
      const reading = datasetReading({ ...base, kind });
      assert.ok(reading.sections.length >= 5);
      assert.equal(reading.analysis?.mode, "dataset");
    }
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(calls, 0);
  const b = analyzeInput(base);
  assert.equal(b.connections.length, 4);
  const originalDescription = preferences.I.description;
  try {
    preferences.I.description = "나중에 바뀐 설명";
    assert.equal(b.concepts?.preferences.I.description, originalDescription);
  } finally {
    preferences.I.description = originalDescription;
  }
  assert.equal(
    analyzeInput({
      ...base,
      dream: "오카피가 우주선을 끌고 왔다는 낯선 꿈이에요.",
      unknownMbti: true,
    }).missing.length,
    2,
  );
  const one = analyzeInput(
    inputSchema.parse({ ...base, unknownMbti: true, unknownDream: true }),
  );
  assert.equal(one.missing.length, 2);
  assert.equal(one.connections.length, 0);
  const noSaju = analyzeInput(
    inputSchema.parse({ ...base, unknownSaju: true }),
  );
  assert.equal(noSaju.saju, null);
  assert.equal(noSaju.connections.length, 0);
  assert.ok(noSaju.mbti && noSaju.dream);
  assert.equal(
    inputSchema.safeParse({
      ...base,
      unknownSaju: true,
      unknownMbti: true,
      unknownDream: true,
    }).success,
    false,
  );
});
test("날짜 기반 조언은 같은 입력에서 일관되고 운세 스키마를 통과한다", () => {
  const a = datasetFortune("2026-11-10", "example");
  assert.deepEqual(a, datasetFortune("2026-11-10", "example"));
  assert.equal(fortuneSchema.safeParse(a).success, true);
  const route = readFileSync("src/app/api/analyze/individual/route.ts", "utf8");
  assert.equal(/lib\/ai|generate\(/.test(route), false);
});

test("종합 출력은 근거에 없는 유형·원국과 잘못된 구조를 거부한다", () => {
  const facts = analyzeInput(base);
  assert.doesNotThrow(() => verifySynthesis(sample, facts));
  assert.throws(
    () =>
      verifySynthesis(
        { ...sample, summary: "제공하지 않은 ENFP의 설명" },
        facts,
      ),
    /MBTI/,
  );
  const foreignPillar = ["甲子", "乙丑", "丙寅", "丁卯", "戊辰"].find(
    (p) => !facts.saju?.pillars.some((s) => s.ganZhi === p),
  )!;
  assert.throws(
    () =>
      verifySynthesis(
        { ...sample, summary: `${foreignPillar}가 당신의 원국입니다.` },
        facts,
      ),
    /원국/,
  );
  assert.equal(synthesisSchema.safeParse(sample).success, false);
  const valid = {
    ...sample,
    keywords: sample.keywords.slice(0, 3),
    sections: [...sample.sections, ...sample.sections.slice(0, 3)],
  };
  assert.equal(synthesisSchema.safeParse(valid).success, true);
  assert.ok(
    analyzeSaju({ ...base, birthDate: "2026-02-04", unknownTime: true })
      .warnings.length,
  );
});
