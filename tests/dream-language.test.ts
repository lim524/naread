import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDream } from "../src/lib/analysis/dream-parser";
import { dreamSymbols, categoryReadings } from "../src/lib/datasets/dream";
const ids = (text: string) => parseDream(text).symbols.map((s) => s.id);
test("확장 사전은 소재별 독립 항목과 카테고리 해석을 제공한다", () => {
  assert.ok(dreamSymbols.length >= 95);
  assert.ok(new Set(dreamSymbols.map((s) => s.category)).size >= 17);
  assert.equal(
    new Set(dreamSymbols.map((s) => s.id)).size,
    dreamSymbols.length,
  );
  for (const symbol of dreamSymbols) {
    assert.ok(symbol.synonyms.length > 0, symbol.id);
    assert.ok(categoryReadings[symbol.category], symbol.category);
    const section = parseDream(`${symbol.synonyms[0]}를 어머니께서 보셨다.`, {
      symbolIds: [symbol.id],
    }).sections.find((s) => s.ruleId === `symbol-${symbol.id}`);
    assert.ok(section && section.body.length > 250, symbol.id);
  }
});
test("소재의 세부 종류를 일반 범주와 중복 인식하지 않는다", () => {
  const symbols = ids("연꽃과 장미 옆에 석류와 알밤, 금반지가 있었다.");
  for (const id of ["lotus", "rose", "pomegranate", "chestnut", "ring"])
    assert.ok(symbols.includes(id), id);
  assert.equal(symbols.includes("flower"), false);
  assert.equal(symbols.includes("gem"), false);
  assert.ok(ids("수달과 돌고래가 물에서 헤엄쳤다.").includes("otter"));
  assert.ok(ids("새끼 코끼리가 다가왔다.").includes("elephant"));
});
test("붙여 쓴 수식어·높임말과 각 소재의 속성을 구분한다", () => {
  const dream = parseDream(
    "황금빛잉어가 맑은 물에서 헤엄쳤다. 할머니께서 금반지를 주셨다.",
  );
  assert.ok(
    dream.attributes.some((a) => a.id === "gold" && a.symbolId === "koi"),
  );
  assert.ok(
    dream.attributes.some((a) => a.id === "clear" && a.symbolId === "water"),
  );
  assert.equal(
    dream.events.find((e) => e.actionId === "give")?.actor,
    "할머니",
  );
  assert.equal(dream.unknownFragments.includes("황금빛잉어"), false);
  assert.ok(dream.combinations.some((c) => c.id === "koi-swim"));
  const colors = parseDream("호랑이는 하얬고 용은 검었다.");
  assert.ok(
    colors.attributes.some((a) => a.id === "white" && a.symbolId === "tiger"),
  );
  assert.ok(
    colors.attributes.some((a) => a.id === "black" && a.symbolId === "dragon"),
  );
});
test("문장 경계·부정·수량·감정의 범위를 유지한다", () => {
  const dream = parseDream(
    "검은 용은 없었다. 하얀 호랑이가 있었다. 무섭지 않았다.",
  );
  assert.equal(
    dream.symbols.some((s) => s.id === "dragon"),
    false,
  );
  assert.equal(
    dream.attributes.some((a) => a.id === "black"),
    false,
  );
  assert.equal(
    dream.attributes.some((a) => a.id === "afraid"),
    false,
  );
  assert.ok(
    dream.attributes.some((a) => a.id === "white" && a.symbolId === "tiger"),
  );
  const count = parseDream("어머니가 한 송이 장미를 받았다.");
  assert.ok(count.attributes.some((a) => a.id === "single"));
  assert.equal(
    count.attributes.some((a) => a.id === "many"),
    false,
  );
  const events = parseDream(
    "용이 여의주를 물지 않았다. 호랑이가 집으로 들어왔다.",
  );
  assert.equal(events.events[0].actionId, "bite");
  assert.equal(events.events[0].negated, true);
  assert.ok(events.combinations.some((c) => c.id === "tiger-house"));
  assert.equal(
    events.combinations.some((c) => c.id === "dragon-pearl"),
    false,
  );
});
test("동음이의어와 관용 표현을 동물·천체로 오인하지 않는다", () => {
  const symbols = ids(
    "말을 했다. 사과를 했다. 배가 불렀다. 새 책을 샀다. 밤에 눈을 맞추었다. 양이 많았다. 알 수 없었다.",
  );
  for (const id of [
    "horse",
    "apple",
    "boat",
    "bird",
    "snow",
    "chestnut",
    "sheep",
    "egg",
  ])
    assert.equal(symbols.includes(id), false, id);
  assert.ok(ids("내가 배를 먹었다.").includes("pear"));
  assert.ok(ids("나는 바다에서 배를 타고 갔다.").includes("boat"));
  assert.ok(ids("하얀 눈이 내렸다.").includes("snow"));
  assert.ok(ids("나는 사과를 받았다.").includes("apple"));
  assert.equal(ids("배가 아파서 물고기를 먹었다.").includes("pear"), false);
  assert.equal(
    parseDream("눈이 내렸다. 나는 눈을 맞추었다.").occurrences.filter(
      (o) => o.symbolId === "snow",
    ).length,
    1,
  );
});
test("앞 장면의 목적어를 다음 장면에 붙이지 않고 모든 후보에서 조합을 찾는다", () => {
  const dream = parseDream(
    "돼지가 여의주를 물고, 용이 여의주를 물었다. 호랑이가 집으로 들어왔다.",
  );
  assert.ok(dream.combinations.some((c) => c.id === "dragon-pearl"));
  assert.ok(dream.combinations.some((c) => c.id === "tiger-house"));
  assert.equal(parseDream("여의주가 용을 물었다.").combinations.length, 0);
  assert.equal(
    parseDream("반지를 받았다.").events.find((e) => e.actionId === "receive")
      ?.actor,
    null,
  );
});
