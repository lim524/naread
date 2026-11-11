import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <span className="overline">404 · A PAGE YET TO BE WRITTEN</span>
      <h1>아직 쓰이지 않은 페이지예요.</h1>
      <p>다시 처음으로 돌아가, 나의 이야기를 이어가세요.</p>
      <Link href="/" className="button primary">
        나읽기 홈으로
      </Link>
    </main>
  );
}
