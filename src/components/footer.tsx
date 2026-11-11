import Link from "next/link";
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Link href="/" className="logo">
            나읽기.
          </Link>
          <p>
            조금 더 나다운 내일을 위해.
            <br />
            사주와 성향으로 읽는, 세상에 하나뿐인 나의 이야기.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/about">서비스 소개</Link>
          <Link href="/help">이용 안내 · FAQ</Link>
          <Link href="/contact">문의하기</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/disclaimer">분석 안내</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} 나읽기. All rights reserved.</span>
        <span>당신의 가능성은 하나의 해석보다 넓습니다.</span>
      </div>
    </footer>
  );
}
