"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="not-found">
      <span className="overline">잠시 쉬어가는 페이지</span>
      <h1>이야기를 불러오지 못했어요.</h1>
      <p>잠시 후 다시 시도해 주세요.</p>
      <button className="button primary" onClick={reset}>
        다시 불러오기
      </button>
    </main>
  );
}
