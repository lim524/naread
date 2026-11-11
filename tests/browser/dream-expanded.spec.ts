import { test, expect } from "@playwright/test";
test("태몽 소재는 카테고리·동의어로 찾고 세부 해석과 장면 관계를 보관한다", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/analyze?type=dream");
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("태몽 확장");
  await page
    .getByRole("textbox", { name: "기억나는 태몽" })
    .fill(
      "할머니께서 금반지를 주셨다. 맑은 물에서 황금빛잉어가 헤엄쳤다. 연꽃이 피었다.",
    );
  await page.getByRole("button", { name: "인식한 내용 확인·수정" }).click();
  await page.getByLabel("태몽 소재 카테고리").selectOption("보석·귀중품");
  await page
    .getByRole("searchbox", { name: "소재·동의어 검색" })
    .fill("금반지");
  await expect(page.locator(".symbol-options .checkbox-row")).toHaveCount(1);
  await expect(
    page.getByRole("checkbox", { name: "반지", exact: true }),
  ).toBeChecked();
  await page.getByLabel("태몽 소재 카테고리").selectOption("과일·열매");
  await page.getByRole("searchbox", { name: "소재·동의어 검색" }).fill("석류");
  await page.getByRole("checkbox", { name: "석류", exact: true }).check();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".dream-confirmation")
    .screenshot({ path: `test-results/dream-search-${info.project.name}.png` });
  await page.locator(".consent input").check();
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/analyze/individual") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  const result = await (await response).json();
  expect(
    result.result.analysis.dream.symbols.map((s: { id: string }) => s.id),
  ).toEqual(
    expect.arrayContaining(["ring", "koi", "lotus", "water", "pomegranate"]),
  );
  expect(
    result.result.analysis.dream.combinations.map((c: { id: string }) => c.id),
  ).toEqual(expect.arrayContaining(["koi-swim", "lotus-bloom"]));
  await expect(page.locator(".reading-section")).toHaveCount(20);
  await expect(
    page.getByRole("heading", {
      name: "주고받는 방향 · 좋은 것을 받았다는 말의 빈칸",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    (await page.locator(".reading-sections").innerText()).length,
  ).toBeGreaterThan(2000);
  await page.reload();
  await expect(page.locator(".reading-section")).toHaveCount(20);
  expect(errors).toEqual([]);
});
