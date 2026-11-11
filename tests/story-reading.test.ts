import { test } from "node:test";
import assert from "node:assert/strict";
import { datasetReading } from "../src/lib/analysis/engine";
import { inputSchema, readingSchema } from "../src/lib/core";
import { storyTopics } from "../src/lib/datasets/story-topics";
const base = inputSchema.parse({
  kind: "comprehensive",
  name: "테스트",
  birthDate: "1995-05-21",
  unknownTime: true,
  mbti: "INTP",
  dream: "검은 용이 여의주를 물고 하늘로 올라갔다.",
});
test("네 종류 해석은 개념 강의 대신 20개의 구분된 풍부한 본문을 제공한다", () => {
  assert.equal(storyTopics.length, 20);
  for (const kind of ["saju", "mbti", "dream", "comprehensive"] as const) {
    const reading = datasetReading({ ...base, kind });
    assert.equal(reading.sections.length, 20, kind);
    assert.equal(new Set(reading.sections.map((s) => s.body)).size, 20, kind);
    assert.deepEqual(
      reading.sections
        .filter((s) => s.body.length < 250)
        .map((s) => `${kind}/${s.title}: ${s.body.length}`),
      [],
    );
    assert.ok(
      reading.sections.every((s) => s.body.split("\n\n").length >= 3),
      kind,
    );
    assert.ok(readingSchema.safeParse(reading).success, kind);
    assert.equal(
      /[ぁ-んァ-ヶ]/.test(reading.sections.map((s) => s.body).join("")),
      false,
    );
  }
});
test("16개 성향과 서로 다른 일간에서 선택되는 이야기의 내용은 달라진다", () => {
  const readings = new Set<string>();
  for (const a of ["I", "E"])
    for (const b of ["S", "N"])
      for (const c of ["T", "F"])
        for (const d of ["J", "P"])
          readings.add(
            JSON.stringify(
              datasetReading({ ...base, kind: "mbti", mbti: a + b + c + d })
                .sections,
            ),
          );
  assert.equal(readings.size, 16);
  const a = datasetReading({ ...base, kind: "saju", birthDate: "1995-05-21" });
  const b = datasetReading({ ...base, kind: "saju", birthDate: "1995-05-22" });
  assert.notDeepEqual(a.sections, b.sections);
});
test("누락한 성향을 추정하지 않고 태몽의 장면과 실제 성격을 구별한다", () => {
  const partial = datasetReading({ ...base, unknownMbti: true });
  assert.equal(partial.analysis!.mbti, null);
  assert.equal(partial.sections.length, 20);
  assert.equal(
    partial.sections.some((s) => s.body.includes("INTP")),
    false,
  );
  const dream = datasetReading({ ...base, kind: "dream" });
  assert.match(dream.sections[2].body, /용/);
  assert.equal(
    dream.sections.some((s) => /당신은 .*성격/.test(s.body)),
    false,
  );
});
