import { test } from "node:test";
import assert from "node:assert/strict";
import {
  koreaDate,
  inputSchema,
  fortuneSchema,
  readingSchema,
} from "../src/lib/core";
import { calculateSaju } from "../src/lib/saju";
import { sample } from "../src/lib/sample";
const input = {
  kind: "comprehensive" as const,
  name: "나",
  birthDate: "1995-05-21",
  birthTime: "14:30",
  unknownTime: false,
  calendar: "solar" as const,
  leapMonth: false,
  mbti: "INTP",
  dream: "검은 용이 맑은 물에서 올라오는 꿈",
};
test("한국 자정 전후에 정확한 날짜를 반환한다", () => {
  assert.equal(koreaDate(new Date("2026-11-10T14:59:59Z")), "2026-11-10");
  assert.equal(koreaDate(new Date("2026-11-10T15:00:00Z")), "2026-11-11");
});
test("분석 종류별 필수 정보를 검증한다", () => {
  assert.equal(inputSchema.safeParse(input).success, true);
  assert.equal(
    inputSchema.safeParse({ ...input, mbti: "XXXX" }).success,
    false,
  );
  assert.equal(inputSchema.safeParse({ ...input, dream: "용" }).success, false);
  assert.equal(
    inputSchema.safeParse({ ...input, birthDate: "2026-02-31" }).success,
    false,
  );
  assert.equal(
    inputSchema.safeParse({ ...input, birthDate: "2999-01-01" }).success,
    false,
  );
  assert.equal(
    inputSchema.safeParse({
      ...input,
      kind: "mbti",
      dream: "",
      birthDate: "",
      birthTime: "",
    }).success,
    true,
  );
});
test("종합 분석은 MBTI와 태몽 중 하나 또는 둘 다 몰라도 가능하다", () => {
  for (const [unknownMbti, unknownDream] of [
    [true, false],
    [false, true],
    [true, true],
  ]) {
    const result = inputSchema.parse({
      ...input,
      mbti: unknownMbti ? "" : input.mbti,
      dream: unknownDream ? "" : input.dream,
      unknownMbti,
      unknownDream,
    });
    assert.equal(result.unknownMbti, unknownMbti);
    assert.equal(result.unknownDream, unknownDream);
  }
  assert.equal(
    inputSchema.safeParse({ ...input, mbti: "", dream: "" }).success,
    false,
  );
});
test("모름으로 바꾼 항목의 기존 내용은 분석과 저장에서 제외된다", () => {
  const result = inputSchema.parse({
    ...input,
    unknownMbti: true,
    unknownDream: true,
  });
  assert.equal(result.mbti, "");
  assert.equal(result.dream, "");
  assert.equal(
    inputSchema.safeParse({ ...result, birthDate: "" }).success,
    false,
  );
  assert.equal(inputSchema.safeParse({ ...result, name: "" }).success, false);
});
test("단독 분석은 모름 표시로 필수 입력을 우회할 수 없다", () => {
  assert.equal(
    inputSchema.safeParse({
      ...input,
      kind: "mbti",
      mbti: "",
      unknownMbti: true,
    }).success,
    false,
  );
  assert.equal(
    inputSchema.safeParse({
      ...input,
      kind: "dream",
      dream: "",
      unknownDream: true,
    }).success,
    false,
  );
  const result = inputSchema.parse({
    ...input,
    kind: "mbti",
    unknownMbti: true,
    unknownDream: true,
  });
  assert.equal(result.unknownMbti, false);
  assert.equal(result.unknownDream, false);
  assert.equal(result.mbti, "INTP");
});
test("종합 분석 자기소개는 선택 입력이고 200자까지 전달한다", () => {
  assert.equal(inputSchema.parse(input).introduction, "");
  assert.equal(
    inputSchema.parse({ ...input, introduction: "   " }).introduction,
    "",
  );
  assert.equal(
    inputSchema.parse({
      ...input,
      introduction: "  새로운 일을 고민하고 있어요.  ",
    }).introduction,
    "새로운 일을 고민하고 있어요.",
  );
  assert.equal(
    inputSchema.parse({ ...input, introduction: "가".repeat(200) }).introduction
      .length,
    200,
  );
  assert.equal(
    inputSchema.safeParse({ ...input, introduction: "가".repeat(201) }).success,
    false,
  );
  assert.equal(
    inputSchema.parse({
      ...input,
      kind: "mbti",
      introduction: "종합 분석용 소개",
    }).introduction,
    "",
  );
});

test("시간 미상은 시주와 시간 오행을 포함하지 않는다", () => {
  const s = calculateSaju({ ...input, unknownTime: true, birthTime: "" });
  assert.equal(s.time, null);
  assert.equal(s.elements.time, null);
  assert.equal(s.day.length, 2);
  assert.equal(s.unknownTime, true);
});
test("시주 포함 원국은 실제 달력 라이브러리로 계산된다", () => {
  const s = calculateSaju(input);
  assert.equal(s.time?.length, 2);
  assert.equal(s.year.length, 2);
  assert.equal(s.month.length, 2);
  assert.equal(s.dayMaster.length, 1);
});
test("AI 응답 구조와 행운 숫자의 범위를 검사한다", () => {
  assert.equal(readingSchema.safeParse(sample).success, true);
  assert.equal(
    fortuneSchema.safeParse({
      message: "오늘은 나를 돌아보세요",
      overall: "차분하게 생각을 정리해 보세요.",
      money: "계획한 지출을 다시 살펴보세요.",
      love: "편안한 마음을 표현해 보세요.",
      relationships: "주변의 이야기를 들어보세요.",
      work: "한 가지 작업부터 정리해 보세요.",
      advice: "작은 질문을 적어 보는 시간을 만드세요.",
      color: "연보라",
      number: 7,
    }).success,
    true,
  );
  assert.equal(fortuneSchema.safeParse({ number: 100 }).success, false);
});
