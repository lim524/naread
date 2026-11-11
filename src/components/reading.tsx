"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Sparkles } from "lucide-react";
import { Note } from "./ui";
import type { Reading as ReadingType } from "@/lib/types";
import AnalysisExplainers from "./analysis-explainers";
import ResultImageActions from "./result-image-actions";
export default function Reading({
  reading,
  isSample = false,
  mbti,
  localOnly = false,
}: {
  reading: ReadingType;
  isSample?: boolean;
  mbti?: string;
  localOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div className="result-hero">
        <span className="pill">
          <Sparkles size={13} />
          {isSample ? "샘플 결과" : "나의 이야기"}
        </span>
        <div className="result-portrait">
          <img
            src={reading.analysis?.image.src || "/dragon.webp"}
            alt={reading.analysis?.image.alt || "구름 속 용의 일러스트"}
          />
        </div>
        <p className="overline">YOUR UNIQUE STORY</p>
        <h1>{reading.title}</h1>
        <p className="result-subtitle">{reading.subtitle}</p>
        <div className="tags centered">
          {mbti && <span className="tag blue">{mbti}</span>}
          <span className="tag peach">자기 이해</span>
          <span className="tag pink">새로운 시선</span>
        </div>
      </div>
      {isSample && (
        <div className="notice">
          이 페이지는 서비스를 둘러보기 위한 샘플입니다. 실제 생년월일을 이용한
          개인 분석이 아닙니다.
        </div>
      )}
      <section className="reading-intro">
        <h2 className="overline">나의 이야기</h2>
        <p>{reading.summary}</p>
        <div className="keyword-row">
          {reading.keywords.map((k) => (
            <span key={k}># {k}</span>
          ))}
        </div>
      </section>
      <ResultImageActions reading={reading} />
      <details className="story-menu">
        <summary>{reading.sections.length}가지 이야기 골라 읽기</summary>
        <nav aria-label="나의 이야기 목차">
          {reading.sections.map((s, i) => (
            <a key={i} href={`#story-${i + 1}`}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {s.title.split(" · ")[0]}
            </a>
          ))}
        </nav>
      </details>
      <div className="reading-sections">
        {reading.sections.map((s, i) => (
          <section className="reading-section" id={`story-${i + 1}`} key={i}>
            <span className="section-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2>{s.title}</h2>
              {s.body.split(/\n\n+/).map((paragraph, index, all) => (
                <p
                  key={index}
                  className={
                    index === 0
                      ? "story-lead"
                      : index === all.length - 1
                        ? "story-turn"
                        : undefined
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
      {reading.analysis && (
        <section
          id="reading-concepts"
          className="reading-concepts"
          aria-label="이야기를 읽은 뒤 보는 개념 설명"
        >
          <div className="concept-heading">
            <span className="overline">BEHIND YOUR STORY</span>
            <h2>이 이야기는 어디에서 왔을까?</h2>
            <p>사주·성향·태몽의 개념은 여기에서 살펴보세요.</p>
          </div>
          <AnalysisExplainers analysis={reading.analysis} />
        </section>
      )}
      <Note />
      <div className="result-actions">
        <Link
          className="button primary"
          href={isSample ? "/analyze" : "/results"}
        >
          {isSample ? "나의 이야기 시작하기" : "저장된 결과 보기"}
          <ArrowRight size={18} />
        </Link>
        <button
          className="button secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${reading.title}\n\n${reading.summary}\n\n${reading.sections.map((section) => `${section.title}\n${section.body}`).join("\n\n")}`,
              );
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
          {copied ? "복사했어요" : "이야기 복사"}
        </button>
      </div>
      {!isSample && (
        <p className="small muted center">
          {localOnly
            ? "이 브라우저에 저장된 결과입니다. 필요한 내용은 PNG로도 저장할 수 있어요."
            : "필요한 내용은 PNG로 저장하거나 복사해 주세요."}
        </p>
      )}
    </>
  );
}
