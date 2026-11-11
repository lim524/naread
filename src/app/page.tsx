import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  ChartNoAxesColumnIncreasing,
  UserRound,
  ArrowUpRight,
} from "lucide-react";
import { CategoryIcon } from "@/components/ui";
import type { Kind } from "@/lib/types";
import ProfileCard from "@/components/profile-card";
export const metadata = { alternates: { canonical: "/" } };
const categories: { kind: Kind; title: string; description: string }[] = [
  { kind: "saju", title: "사주팔자", description: "태어난 순간의 이야기" },
  { kind: "mbti", title: "MBTI", description: "나의 성격과 관계" },
  { kind: "dream", title: "태몽", description: "태어나기 전의 이야기" },
  {
    kind: "comprehensive",
    title: "종합 분석",
    description: "결과를 하나의 프로필로",
  },
];
export default function Home() {
  return (
    <main id="main" className="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-star">✦</span> 나를 알아가는 가장 새로운 방법
          </div>
          <h1>나는 어떤 사람일까?</h1>
          <p>
            사주부터 MBTI, 태몽까지.
            <br className="mobile-break" /> 사주와 성향으로 읽는 나의 이야기를
            만나보세요.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/analyze">
              나의 이야기 시작하기
              <ArrowRight size={21} />
            </Link>
            <Link className="button secondary" href="/sample">
              샘플 보기
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="green-dot" /> 가입 없이 무료로 시작하세요{" "}
            <span>·</span> 모든 분석 무료
          </div>
        </div>
        <div
          className="hero-art"
          role="img"
          aria-label="눈을 감고 나를 돌아보는 여성의 일러스트"
        >
          <div className="hero-orb" />
          <img src="/woman.webp" alt="" />
          <span className="art-sparkle">✦</span>
          <span className="art-caption">Every story begins with you.</span>
        </div>
      </section>
      <section className="discovery-grid" aria-label="분석 종류와 샘플 결과">
        <div className="category-grid">
          {categories.map((c) => (
            <Link
              className="category-card"
              href={`/analyze?type=${c.kind}`}
              key={c.kind}
            >
              <CategoryIcon kind={c.kind} />
              <div>
                <h2>{c.title}</h2>
                <p>{c.description}</p>
              </div>
              <ChevronRight size={20} strokeWidth={1.5} />
            </Link>
          ))}
        </div>
        <ProfileCard />
      </section>
      <section className="how-it-works">
        <div className="how-copy">
          <span className="overline">HOW IT WORKS</span>
          <h2>나읽기는 이렇게 분석해요.</h2>
          <p>
            서로 다른 세 가지 시선을 모아,
            <br />
            세상에 하나뿐인 나의 프로필을 만듭니다.
          </p>
        </div>
        <div className="steps">
          {[
            {
              icon: FileText,
              label: "정보 입력",
              text: "나의 이야기 들려주기",
              cls: "blue",
            },
            {
              icon: ChartNoAxesColumnIncreasing,
              label: "개별 분석",
              text: "세 가지 관점으로 읽기",
              cls: "lavender",
            },
            {
              icon: UserRound,
              label: "종합 프로필",
              text: "하나로 이어지는 나",
              cls: "pink",
            },
          ].map((s, i) => (
            <div className="step-wrap" key={s.label}>
              <div className="step">
                <span className={`step-icon ${s.cls}`}>
                  <s.icon size={27} strokeWidth={1.4} />
                  {i === 2 && <i>✦</i>}
                </span>
                <div>
                  <h3>
                    <span>0{i + 1}</span> {s.label}
                  </h3>
                  <p>{s.text}</p>
                </div>
              </div>
              {i < 2 && <ChevronRight className="step-chevron" size={19} />}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
