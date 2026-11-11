import { test, expect, type Page } from "@playwright/test";
import type { Kind, SavedReading } from "../../src/lib/types";
async function analyze(page: Page, kind: Kind): Promise<SavedReading> {
  await page.goto(`/analyze?type=${kind}`);
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("보관 테스트");
  if (kind === "saju" || kind === "comprehensive") {
    await page.getByLabel("생년월일", { exact: true }).fill("19950521");
    await page.getByLabel("태어난 시간을 몰라요", { exact: false }).check();
  }
  if (kind === "comprehensive")
    await page.getByRole("button", { name: "다음으로" }).click();
  if (kind === "mbti" || kind === "comprehensive")
    await page.getByRole("button", { name: "INTP", exact: true }).click();
  if (kind === "comprehensive")
    await page.getByRole("button", { name: "다음으로" }).click();
  if (kind === "dream" || kind === "comprehensive")
    await page
      .getByRole("textbox", { name: "기억나는 태몽" })
      .fill("하얀 호랑이가 집 안으로 들어오는 꿈");
  await page.locator(".consent input").check();
  const response = page.waitForResponse(
    (r) => r.url().includes("/api/analyze") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  const data = await (await response).json();
  await expect(page).toHaveURL(`/result/${data.id}`);
  await expect(page.locator(".result-hero h1")).toBeVisible();
  return data.reading;
}
test("네 종류 결과는 새 탭에서도 보존되고 종합 프로필은 홈·운세에 연결된다", async ({
  page,
  context,
}, info) => {
  for (const kind of ["saju", "mbti", "dream"] as const)
    await analyze(page, kind);
  const profile = await analyze(page, "comprehensive");
  const second = await context.newPage();
  await second.goto("/results");
  await expect(second.locator(".saved-reading")).toHaveCount(4);
  await page.close();
  await second.goto("/");
  await expect(second.locator(".sample-label")).toHaveText(
    "보관 테스트님의 프로필",
  );
  await expect(second.locator(".sample-art img")).toHaveAttribute(
    "src",
    profile.result.analysis!.image.src,
  );
  expect(profile.result.analysis!.image.src).not.toBe("/dragon.webp");
  await second.screenshot({
    path: `test-results/personal-home-${info.project.name}.png`,
    fullPage: true,
  });
  await second.goto("/fortune");
  let first = "";
  for (const label of ["오늘의 운세", "주간 운세", "월간 운세", "연간 운세"]) {
    await second.getByRole("button", { name: label, exact: true }).click();
    await expect(second.locator(".fortune-card")).toHaveCount(6);
    await expect(
      second.getByRole("button", { name: label, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    if (label === "오늘의 운세")
      first = await second.locator(".fortune-grid").innerText();
  }
  await second.reload();
  await expect(second.locator(".fortune-card")).toHaveCount(6);
  expect(await second.locator(".fortune-grid").innerText()).toBe(first);
  const cached = await second.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const req = indexedDB.open("nailgi-library", 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const count = db
            .transaction("fortunes")
            .objectStore("fortunes")
            .count();
          count.onsuccess = () => {
            resolve(count.result);
            db.close();
          };
        };
      }),
  );
  expect(cached).toBe(4);
  await second.goto(`/result/${profile.id}`);
  await second
    .getByRole("button", { name: "이 결과 삭제", exact: true })
    .click();
  await second.getByRole("button", { name: "삭제하기", exact: true }).click();
  await expect(second).toHaveURL("/results");
  await expect(second.locator(".saved-reading")).toHaveCount(3);
  await second.goto("/fortune");
  await expect(
    second.getByRole("heading", { name: "종합 분석을 먼저 완료해 주세요." }),
  ).toBeVisible();
});
test("백업으로 종합 결과를 복원하고 내 프로필을 다시 사용할 수 있다", async ({
  page,
}) => {
  const profile = await analyze(page, "comprehensive");
  await page.goto("/results");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "전체 결과 백업" }).click();
  const download = await downloadPromise;
  const file = await download.path();
  expect(file).toBeTruthy();
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  await page.getByRole("button", { name: "삭제 확인", exact: true }).click();
  await expect(page.locator(".saved-reading")).toHaveCount(0);
  await page.getByLabel("결과 백업 불러오기").setInputFiles(file!);
  await expect(page.locator(".saved-reading")).toHaveCount(1);
  await expect(page.getByRole("status")).toContainText("1개의 결과");
  await page.goto(`/result/${profile.id}`);
  await expect(page.locator(".result-hero h1")).toHaveText(
    profile.result.title,
  );
});
test("저장 실패를 성공으로 표시하거나 결과 화면으로 이동하지 않는다", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", { value: undefined }),
  );
  await page.goto("/analyze?type=mbti");
  await page
    .getByRole("textbox", { name: "어떻게 불러드릴까요?" })
    .fill("저장 오류");
  await page.getByRole("button", { name: "INTP", exact: true }).click();
  await page.locator(".consent input").check();
  await page.getByRole("button", { name: "나의 이야기 분석하기" }).click();
  await expect(page.locator(".error-message[role=alert]")).toContainText(
    "결과 저장을 사용할 수 없습니다",
  );
  await expect(page).toHaveURL(/\/analyze\?type=mbti/);
});
