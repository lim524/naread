import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("사주 결과는 20개 이야기를 먼저 보여주고 개념 설명은 아래에 둔다", async ({
  page,
}) => {
  await page.goto("/analyze?type=saju");
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("사주 테스트");
  await page.getByLabel("생년월일", { exact: true }).fill("19950521");
  await page.getByLabel("태어난 시간을 몰라요", { exact: false }).check();
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  await expect(page).toHaveURL(/\/result\/local-/);
  await expect(page.locator(".reading-section")).toHaveCount(20);
  for (const name of [
    "첫인상과 속마음 · 겉만 보고 판단하면 틀린다",
    "싸울 때 쓰는 무기 · 당신도 편한 상대는 아니다",
    "배움의 승부처 · 머리보다 방식이 갈리는 자리",
    "연애의 반복 실수 · 잘해주고도 서운한 이유",
  ]) {
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.locator(
      ".advice-box, .pillar-branch-reading, .calculation-details, .dataset-provenance",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".section-number").last()).toHaveText("20");
  expect(
    await page.evaluate(
      () =>
        !!(
          document
            .querySelector(".reading-sections")!
            .compareDocumentPosition(
              document.querySelector(".reading-concepts")!,
            ) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
    ),
  ).toBe(true);
  await page.locator(".story-menu summary").click();
  await expect(
    page
      .getByRole("navigation", { name: "나의 이야기 목차" })
      .getByRole("link"),
  ).toHaveCount(20);
  await page.reload();
  await expect(page.locator(".reading-section")).toHaveCount(20);
});

test("삽화 설명은 실제 원국·오행·선호를 표시하고 모바일에서 넘치지 않는다", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/sample");
  await expect(
    page.getByRole("heading", { name: "나에게 건네는 작은 제안" }),
  ).toHaveCount(0);
  await expect(
    page.locator(
      ".pillar-branch-reading, .calculation-details, .dataset-provenance",
    ),
  ).toHaveCount(0);
  await expect(
    page.getByText("표면의 천간·지지만 세었어요.", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "연주 · 월주 · 일주 · 시주" }),
  ).toBeVisible();
  await expect(page.locator(".pillar-card")).toHaveCount(4);
  await expect(
    page.getByRole("heading", { name: "INTP, 네 글자를 하나씩" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "나의 사주와 MBTI가 만나는 지점" }),
  ).toBeVisible();
  await expect(page.locator(".connection-cards article")).toHaveCount(4);
  await page.getByRole("button", { name: /^목 木:/ }).click();
  await page.getByRole("button", { name: "상극 · 조절하는 관계" }).click();
  await expect(page.locator(".element-explanation")).toContainText(
    "상극: 목 → 토",
  );
  await page
    .getByText("I · E · S · N · T · F · J · P 전체 개념 비교", { exact: true })
    .click();
  await expect(page.locator(".preference-compare article")).toHaveCount(8);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const brokenImages = await page
    .locator(".analysis-explainers img")
    .evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (image) => {
          const img = image as HTMLImageElement;
          img.loading = "eager";
          try {
            await img.decode();
          } catch {}
        }),
      );
      return images
        .filter((image) => !(image as HTMLImageElement).naturalWidth)
        .map((image) => (image as HTMLImageElement).src);
    });
  expect(brokenImages).toEqual([]);
  await page
    .locator(".concept-section")
    .first()
    .screenshot({
      path: `test-results/pillars-${info.project.name}.png`,
      style: "header,.skip-link{visibility:hidden!important}",
    });
  await page
    .locator(".element-wheel")
    .screenshot({ path: `test-results/elements-${info.project.name}.png` });
  expect(errors).toEqual([]);
});

test("MBTI 개별 분석은 실제 데이터셋 API로 완료되고 PNG 저장·새로고침·삭제가 된다", async ({
  page,
}, info) => {
  await page.goto("/analyze?type=mbti");
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("개별 테스트");
  await page.getByRole("button", { name: "INTP", exact: true }).click();
  await page.locator(".consent input").check();
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/analyze/individual") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  const result = await response.json();
  expect(result.result.analysis.mode).toBe("dataset");
  expect(result.result.analysis.mbti.type).toBe("INTP");
  await expect(page).toHaveURL(/\/result\/local-/);
  await expect(page.locator(".result-hero h1")).toHaveText(
    "질문을 확장하는 탐구자",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "프로필 PNG 저장" }).click();
  const download = await downloadPromise;
  const path = `test-results/profile-${info.project.name}.png`;
  await download.saveAs(path);
  const png = readFileSync(path);
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(1600);
  await page.reload();
  await expect(page.locator(".result-hero h1")).toHaveText(
    "질문을 확장하는 탐구자",
  );
  await page.getByRole("button", { name: "이 결과 삭제", exact: true }).click();
  await page.getByRole("button", { name: "삭제하기", exact: true }).click();
  await expect(page).toHaveURL(/\/results$/);
});

test("태몽의 주체·대상을 사용자가 고치면 실제 분석 결과에 반영된다", async ({
  page,
}) => {
  await page.goto("/analyze?type=dream");
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("태몽 테스트");
  await page
    .getByRole("textbox", { name: "기억나는 태몽" })
    .fill("검은 용이 나를 잡았다. 아주 기억에 남았어요.");
  await page.getByRole("button", { name: "인식한 내용 확인·수정" }).click();
  await page.getByRole("textbox", { name: "행동한 주체" }).fill("나");
  await page.getByRole("textbox", { name: "대상 또는 목적지" }).fill("용");
  await page.locator(".consent input").check();
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/analyze/individual") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  const result = await (await responsePromise).json();
  expect(
    result.result.analysis.dream.events.find(
      (e: { actionId: string }) => e.actionId === "catch",
    ),
  ).toMatchObject({ actor: "나", target: "용" });
  expect(result.result.analysis.image.illustrationId).toBe("dragon-water");
  await expect(page.locator(".dream-event-line").first()).toContainText("나");
});

test("종합에서 한 정보만 알면 AI 없이 부분 결과를 제공한다", async ({
  page,
}) => {
  await page.goto("/analyze");
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("부분 결과");
  await page.getByLabel("생년월일을 몰라 사주를 제외할게요").check();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page.getByLabel("MBTI를 몰라요", { exact: true }).check();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page
    .getByRole("textbox", { name: "기억나는 태몽" })
    .fill("어머니가 복숭아를 받았다는 꿈을 기억하셨어요.");
  await page.locator(".consent input").check();
  const responsePromise = page.waitForResponse(
    (r) => r.url().endsWith("/api/analyze") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  const result = await response.json();
  expect(result.localOnly).toBe(true);
  expect(result.result.analysis.saju).toBeNull();
  expect(result.result.analysis.mbti).toBeNull();
  await expect(page.locator(".result-hero h1")).toHaveText("복숭아의 관찰자");
});

test("자체 성향 질문은 명시적인 참고 유형으로만 선택된다", async ({ page }) => {
  await page.goto("/analyze?type=mbti");
  await page
    .getByText("MBTI를 모른다면 · 간단한 성향 살펴보기", { exact: true })
    .click();
  const groups = page.locator(".preference-quiz fieldset");
  await expect(groups).toHaveCount(12);
  for (let i = 0; i < 12; i++)
    await groups.nth(i).locator('input[type="radio"]').first().check();
  await expect(page.locator(".preference-quiz")).toContainText(
    "지금의 응답과 가까운 조합: ESTJ",
  );
  await page.getByRole("button", { name: "이 참고 유형으로 살펴보기" }).click();
  await expect(
    page.getByRole("button", { name: "ESTJ", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
