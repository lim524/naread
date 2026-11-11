import { test, expect } from "@playwright/test";
test("이전 저장 결과도 20개 이야기로 갱신하고 선택한 프로필은 바꾸지 않는다", async ({
  page,
  request,
}, info) => {
  await page.goto("/results");
  await expect(page.getByText("아직 저장한 결과가 없습니다.")).toBeVisible();
  const input = {
    kind: "comprehensive",
    name: "이야기 테스트",
    birthDate: "1995-05-21",
    unknownTime: true,
    mbti: "INTP",
    dream: "검은 용이 여의주를 물고 있었다.",
  };
  const first = await (
    await request.post("/api/analyze", { data: input })
  ).json();
  const second = await (
    await request.post("/api/analyze", { data: { ...input, mbti: "ENFJ" } })
  ).json();
  delete first.reading.result.storyVersion;
  first.reading.result.sections = [
    { title: "이전 결과", body: "이전 버전의 짧은 설명입니다." },
  ];
  await page.evaluate(
    ({ a, b }) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("nailgi-library", 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(["readings", "settings"], "readwrite");
          tx.objectStore("readings").put(a);
          tx.objectStore("readings").put(b);
          tx.objectStore("settings").put(b.id, "activeProfile");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => reject(tx.error);
        };
      }),
    { a: first.reading, b: second.reading },
  );
  await page.goto(`/result/${first.id}`);
  await expect(page.locator(".reading-section")).toHaveCount(20);
  await expect(page.locator(".reading-intro h2")).toHaveText("나의 이야기");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".reading-section > div")
      .evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            node.getBoundingClientRect().right <=
            node.parentElement!.getBoundingClientRect().right + 1,
        ),
      ),
  ).toBe(true);
  await page
    .locator(".reading-intro")
    .screenshot({ path: `test-results/story-intro-${info.project.name}.png` });
  await page
    .locator(".reading-section")
    .first()
    .screenshot({ path: `test-results/story-first-${info.project.name}.png` });
  const active = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const req = indexedDB.open("nailgi-library", 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const get = db
            .transaction("settings")
            .objectStore("settings")
            .get("activeProfile");
          get.onsuccess = () => {
            resolve(get.result);
            db.close();
          };
        };
      }),
  );
  expect(active).toBe(second.id);
  await page
    .getByRole("link", { name: "저장된 결과 보기", exact: true })
    .click();
  await expect(page).toHaveURL("/results");
  await expect(page.locator(".saved-reading")).toHaveCount(2);
});
