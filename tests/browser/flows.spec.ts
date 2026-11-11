import { test, expect } from "@playwright/test";
test("홈·샘플은 공개되고 읽기 가이드는 제거된다", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "나는 어떤 사람일까?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "나의 이야기 시작하기" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/home-${info.project.name}.png`,
    fullPage: true,
  });
  await page.locator(".sample-card").click();
  await expect(
    page.getByRole("heading", { name: "흑룡의 탐구자", exact: true }),
  ).toBeVisible();
  await page.goto("/guides/understanding-saju");
  await expect(
    page.getByRole("heading", { name: "네 기둥과 여덟 글자" }),
  ).toHaveCount(0);
  await expect(page.locator('a[href^="/guides"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("종합 입력을 완료하면 무료 분석 결과로 이동한다", async ({ page }) => {
  await page.goto("/analyze");
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("테스트");
  await page.getByLabel("생년월일", { exact: true }).fill("19950521");
  await page.getByLabel("태어난 시간을 몰라요", { exact: false }).check();
  await page.getByRole("button", { name: "다음으로" }).click();
  await expect(
    page.getByRole("heading", { name: "어떤 성격을 가지고 있나요?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "INTP", exact: true }).click();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page
    .getByRole("textbox", { name: "기억나는 태몽" })
    .fill("검은 용이 맑은 물에서 하늘로 올라오는 꿈을 꾸셨대요.");
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  await expect(page).toHaveURL(/\/result\/local-/);
  await expect(page.locator(".reading-sections")).toBeVisible();
});
test("종합 분석은 MBTI·태몽 모름 선택을 전송하고 이전 내용을 제외한다", async ({
  page,
}) => {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({ status: 503, json: { error: "테스트 분석 응답" } });
  });
  await page.goto("/analyze");
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("모름 테스트");
  await page.getByLabel("생년월일", { exact: true }).fill("19950521");
  await page.getByLabel("태어난 시간을 몰라요", { exact: false }).check();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page.getByRole("button", { name: "INTP", exact: true }).click();
  await page.getByLabel("MBTI를 몰라요", { exact: true }).check();
  await expect(
    page.getByRole("button", { name: "INTP", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "ENFP", exact: true }).click();
  await expect(
    page.getByLabel("MBTI를 몰라요", { exact: true }),
  ).not.toBeChecked();
  await page.getByLabel("MBTI를 몰라요", { exact: true }).check();
  await page.getByRole("button", { name: "다음으로" }).click();
  const dream = page.getByRole("textbox", { name: "기억나는 태몽" });
  await dream.fill("검은 용이 하늘로 올라가는 꿈을 꾸셨대요.");
  const unknownDream = page.getByLabel("태몽을 모르거나 기억나지 않아요", {
    exact: true,
  });
  const dreamBox = await dream.boundingBox();
  const checkboxBox = await unknownDream.boundingBox();
  expect(checkboxBox!.y).toBeGreaterThan(dreamBox!.y + dreamBox!.height);
  await unknownDream.check();
  await expect(dream).toBeDisabled();
  await unknownDream.uncheck();
  await expect(dream).toBeEnabled();
  await expect(dream).toHaveValue("검은 용이 하늘로 올라가는 꿈을 꾸셨대요.");
  await unknownDream.check();
  await page.getByRole("button", { name: "이전", exact: true }).click();
  await expect(page.getByLabel("MBTI를 몰라요", { exact: true })).toBeChecked();
  await page.getByRole("button", { name: "다음으로" }).click();
  await expect(unknownDream).toBeChecked();
  await page.locator(".consent input").check();
  const request = page.waitForRequest(
    (r) => r.url().endsWith("/api/analyze") && r.method() === "POST",
  );
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  expect((await request).postDataJSON()).toMatchObject({
    kind: "comprehensive",
    unknownMbti: true,
    unknownDream: true,
    mbti: "",
    dream: "",
    birthDate: "1995-05-21",
  });
  await expect(page.locator(".error-message[role=alert]")).toHaveText(
    "테스트 분석 응답",
  );
  await page.getByRole("button", { name: "MBTI", exact: true }).click();
  await expect(page.getByLabel("MBTI를 몰라요", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "ENFP", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("운세는 종합 프로필이 있어야 열리고 이전 API는 제거된다", async ({
  page,
  request,
}) => {
  await page.goto("/fortune");
  await expect(
    page.getByRole("heading", {
      name: "종합 분석을 먼저 완료해 주세요.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".fortune-card")).toHaveCount(0);
  for (const path of [
    "/login",
    "/mypage",
    "/api/account",
    "/api/admin",
    "/api/status",
    "/api/fortune",
    "/guides",
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
});
test("광고 설정 전에는 광고 스크립트를 요청하지 않는다", async ({
  page,
  request,
}) => {
  await page.goto("/sample");
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  expect(await (await request.get("/ads.txt")).text()).toContain("disabled");
});
