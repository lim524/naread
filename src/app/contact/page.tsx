import Link from "next/link";
export const metadata = {
  title: "문의하기",
  description: "나읽기 서비스 및 개인정보 관련 문의 안내",
  alternates: { canonical: "/contact" },
};
export default function Contact() {
  const email = process.env.CONTACT_EMAIL;
  return (
    <main id="main" className="policy-page">
      <span className="overline">WE ARE HERE TO LISTEN</span>
      <h1 style={{ marginTop: 16 }}>당신의 이야기를 듣겠습니다.</h1>
      <p className="muted">
        서비스 이용, 분석 오류, 개인정보 관련 문의를 안내합니다.
      </p>
      <section>
        <h2>문의 방법</h2>
        {email ? (
          <p>
            <a href={`mailto:${email}`}>{email}</a>로 문의해 주세요. 이용한
            기능, 오류가 발생한 시간, 표시된 안내 문구를 함께 적어주시면 확인에
            도움이 됩니다.
          </p>
        ) : (
          <p>
            현재 개발 MVP로, 운영자의 문의 이메일이 아직 등록되지 않았습니다.
            공개 운영 전에 연락처를 설정할 예정입니다. 사용할 수 없는 문의
            양식으로 개인정보를 수집하지 않습니다.
          </p>
        )}
      </section>
      <section>
        <h2>개인정보 삭제 요청</h2>
        <p>
          회원은 마이페이지에서 분석 결과를 삭제하거나 탈퇴할 수 있습니다.
          비회원은 결과 화면에서 삭제할 수 있습니다. 비밀번호나 인증 토큰,
          상세한 출생 정보는 이메일에 보내지 마세요.
        </p>
      </section>
      <section>
        <h2>먼저 확인해 보세요</h2>
        <p>
          <Link href="/help">서비스 이용 안내</Link>에서 분석 방법, 운세 생성과
          결과 보관에 대한 답을 확인할 수 있습니다.
        </p>
      </section>
      <Link className="button secondary" href="/help">
        이용 안내 · FAQ 보기
      </Link>
    </main>
  );
}
