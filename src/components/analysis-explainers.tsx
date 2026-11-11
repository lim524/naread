"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import type {
  AnalysisBundle,
  Element,
  SajuAnalysis,
} from "@/lib/analysis/types";
import {
  elements,
  elementOrder,
  generation,
  control,
} from "@/lib/datasets/saju";
import { preferences } from "@/lib/datasets/mbti-preferences";

const concepts = "/illustrations/concepts-v1/";
const pillarCopy = {
  year: {
    title: "연주",
    image: "pillar-year",
    body: "태어난 해의 글자 · 출발과 배경을 돌아보는 전통적 관점",
  },
  month: {
    title: "월주",
    image: "pillar-month",
    body: "절기에 따른 달의 글자 · 계절과 환경을 함께 읽는 관점",
  },
  day: {
    title: "일주",
    image: "pillar-day",
    body: "태어난 날의 글자 · 일간을 해석의 기준으로 삼는 관점",
  },
  time: {
    title: "시주",
    image: "pillar-hour",
    body: "태어난 시간의 글자 · 시간이 알려진 경우에만 읽는 관점",
  },
};
function PillarCards({ saju }: { saju: SajuAnalysis }) {
  return (
    <section className="concept-section" aria-labelledby="pillar-heading">
      <div className="concept-heading">
        <span className="pill">
          <Sparkles size={14} />
          개념 이해
        </span>
        <h2 id="pillar-heading">연주 · 월주 · 일주 · 시주</h2>
        <p>네 기둥의 의미를 이해하고, 나의 실제 글자를 읽어보세요.</p>
      </div>
      {saju.warnings.map((warning) => (
        <p className="notice" key={warning}>
          {warning}
        </p>
      ))}
      <div className="pillar-grid">
        {(Object.keys(pillarCopy) as (keyof typeof pillarCopy)[]).map(
          (id, i) => {
            const copy = pillarCopy[id],
              pillar = saju.pillars.find((p) => p.id === id);
            return (
              <article className={`pillar-card pillar-${i}`} key={id}>
                <h3>{copy.title}</h3>
                <div className="pillar-glyph">
                  <span>
                    <small>천간</small>
                    <b>{pillar ? `${pillar.stemName} ${pillar.stem}` : "—"}</b>
                  </span>
                  <span>
                    <small>지지</small>
                    <b>
                      {pillar ? `${pillar.branchName} ${pillar.branch}` : "—"}
                    </b>
                  </span>
                </div>
                <img
                  src={`${concepts}${copy.image}.webp`}
                  alt=""
                  loading="lazy"
                  width="180"
                  height="180"
                />
                <p>{copy.body}</p>
                {!pillar && (
                  <strong className="small">시간 미상 · 시주 해석 제외</strong>
                )}
                {pillar && (
                  <dl>
                    <dt>음양 · 천간 오행</dt>
                    <dd>
                      {pillar.yinYang} · {elements[pillar.element].name}
                    </dd>
                    <dt>십성</dt>
                    <dd>{pillar.tenGod}</dd>
                    <dt>지장간</dt>
                    <dd>{pillar.hiddenStems.join(" · ")}</dd>
                    <dt>지장간 십성</dt>
                    <dd>{pillar.hiddenTenGods.join(" · ")}</dd>
                  </dl>
                )}
              </article>
            );
          },
        )}
      </div>
      <p className="concept-footnote">
        천간과 지지 네 쌍이 사주의 여덟 글자예요. 글자의 관계는 전통적인 문화
        해석이며, 인생의 사건을 확정하지 않아요.
      </p>
    </section>
  );
}
const wheelPositions = [
  { x: 300, y: 100 },
  { x: 490, y: 240 },
  { x: 420, y: 460 },
  { x: 180, y: 460 },
  { x: 110, y: 240 },
];
function Wheel({
  saju,
  elementSnapshot,
}: {
  saju: SajuAnalysis;
  elementSnapshot?: typeof elements;
}) {
  const [selected, setSelected] = useState<Element>(saju.dayElement);
  const [showControl, setShowControl] = useState(false);
  const elementData = elementSnapshot || elements;
  const e = elementData[selected];
  const total = Object.values(saju.counts).reduce((a, b) => a + b, 0);
  function line(a: number, b: number) {
    const start = wheelPositions[a],
      end = wheelPositions[b];
    const dx = end.x - start.x,
      dy = end.y - start.y,
      length = Math.hypot(dx, dy);
    return {
      x1: start.x + (dx / length) * 76,
      y1: start.y + (dy / length) * 76,
      x2: end.x - (dx / length) * 80,
      y2: end.y - (dy / length) * 80,
    };
  }
  return (
    <section className="concept-section" aria-labelledby="element-heading">
      <div className="concept-heading">
        <span className="pill">
          <Sparkles size={14} />
          개념 이해
        </span>
        <h2 id="element-heading">음양오행</h2>
        <p>성장 · 표현 · 연결 · 정리 · 사유의 다섯 가지 비유</p>
      </div>
      <div className="element-relation-controls" aria-label="오행 관계 선택">
        <button
          type="button"
          className={!showControl ? "selected" : ""}
          aria-pressed={!showControl}
          onClick={() => setShowControl(false)}
        >
          상생 · 이어 주는 관계
        </button>
        <button
          type="button"
          className={showControl ? "selected" : ""}
          aria-pressed={showControl}
          onClick={() => setShowControl(true)}
        >
          상극 · 조절하는 관계
        </button>
      </div>
      <div className="element-wheel">
        <svg viewBox="0 0 600 560" aria-hidden="true">
          <defs>
            <marker
              id="element-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0,0 L7,3.5 L0,7" fill="#aa94b3" />
            </marker>
          </defs>
          {elementOrder.map((id, index) => (
            <line
              key={id}
              {...line(
                index,
                elementOrder.indexOf((showControl ? control : generation)[id]),
              )}
              stroke="#aa94b3"
              strokeWidth="2"
              strokeDasharray={showControl ? "7 7" : undefined}
              markerEnd="url(#element-arrow)"
            />
          ))}
        </svg>
        <span className="wheel-center" aria-hidden="true">
          ☯
        </span>
        {elementOrder.map((id, index) => (
          <button
            type="button"
            key={id}
            className={`element-node element-${id} ${selected === id ? "active" : ""}`}
            style={{
              left: `${wheelPositions[index].x / 6}%`,
              top: `${wheelPositions[index].y / 5.6}%`,
            }}
            aria-pressed={selected === id}
            aria-label={`${elementData[id].name} ${elementData[id].hanja}: ${saju.counts[id]}개, 설명 보기`}
            onClick={() => setSelected(id)}
          >
            <img
              src={`${concepts}element-${id}.webp`}
              alt=""
              width="180"
              height="180"
              loading="lazy"
            />
            <b>
              {elementData[id].name}
              <small>({elementData[id].hanja})</small>
            </b>
            <span>{elementData[id].keyword}</span>
            <small>
              {saju.counts[id]} / {total}글자
            </small>
          </button>
        ))}
      </div>
      <div
        className={`element-explanation element-${selected}`}
        aria-live="polite"
      >
        <h3>
          {e.name}({e.hanja}) · {e.keyword}
        </h3>
        <p>{e.meaning}</p>
        <p>
          {e.strength} {e.caution}
        </p>
        <p className="small">
          {showControl
            ? `상극: ${e.name} → ${elementData[control[selected]].name}. 서로 조절하는 전통적 관계이며 상대를 해친다는 뜻은 아니에요.`
            : `상생: ${e.name} → ${elementData[generation[selected]].name}. 서로 이어 주는 전통적 관계이며 좋은 일이 생긴다는 예언은 아니에요.`}
        </p>
      </div>
    </section>
  );
}
export default function AnalysisExplainers({
  analysis,
}: {
  analysis: AnalysisBundle;
}) {
  const preferenceData = analysis.concepts?.preferences || preferences;
  return (
    <div className="analysis-explainers">
      {analysis.saju && (
        <>
          <PillarCards saju={analysis.saju} />
          <Wheel
            saju={analysis.saju}
            elementSnapshot={analysis.concepts?.elements}
          />
        </>
      )}
      {analysis.mbti && (
        <section className="concept-section" aria-labelledby="mbti-heading">
          <div className="concept-heading">
            <span className="pill">
              <Sparkles size={14} />
              개념 이해
            </span>
            <h2 id="mbti-heading">{analysis.mbti.type}, 네 글자를 하나씩</h2>
            <p>
              {analysis.mbti.source === "quick-reflection"
                ? "12개 자체 질문의 참고 결과예요. 공식 검사나 확정된 유형은 아닙니다."
                : "알려주신 선호를 네 가지 관점으로 풀어보세요."}
            </p>
          </div>
          <div className="preference-cards">
            {analysis.mbti.letters.map((letter) => {
              const p = preferenceData[letter];
              return (
                <article key={letter} className="preference-card">
                  <span className="preference-axis">{p.axis}</span>
                  <img
                    src={`${concepts}${p.image}.webp`}
                    alt=""
                    width="200"
                    height="200"
                    loading="lazy"
                  />
                  <h3>
                    <b>{letter}</b> {p.name}
                  </h3>
                  <p>{p.description}</p>
                  <p className="preference-example">{p.example}</p>
                  <details>
                    <summary>오해하기 쉬운 점과 작은 연습</summary>
                    <p>{p.misconception}</p>
                    <p>{p.practice}</p>
                  </details>
                </article>
              );
            })}
          </div>
          <details className="other-preferences">
            <summary>I · E · S · N · T · F · J · P 전체 개념 비교</summary>
            <div className="preference-compare">
              {(["E", "I", "S", "N", "T", "F", "J", "P"] as const).map(
                (letter) => (
                  <article key={letter}>
                    <h3>
                      {letter} · {preferenceData[letter].name}
                    </h3>
                    <p>{preferenceData[letter].description}</p>
                    <p className="small muted">
                      {preferenceData[letter].misconception}
                    </p>
                  </article>
                ),
              )}
            </div>
          </details>
          <p className="concept-footnote">
            두 쪽 모두 사용할 수 있는 선호의 차이예요. 능력이나 성격의 우열을
            나타내지 않으며 네 글자만으로 개인 전체를 설명하지 않아요.
          </p>
        </section>
      )}
      {analysis.connections.length > 0 && (
        <section
          className="concept-section"
          aria-labelledby="connection-heading"
        >
          <div className="concept-heading">
            <span className="pill">
              <Sparkles size={14} />
              나란히 읽기
            </span>
            <h2 id="connection-heading">나의 사주와 MBTI가 만나는 지점</h2>
            <p>
              같다고 단정하지 않고, 함께 떠올릴 장면과 서로 다른 점을 살펴봐요.
            </p>
          </div>
          <div className="connection-cards">
            {analysis.connections.map((c) => (
              <article key={c.letter}>
                <div className="connection-art">
                  <img
                    src={`${concepts}${preferenceData[c.letter].image}.webp`}
                    alt=""
                    width="120"
                    height="120"
                  />
                  <span>+</span>
                  <img
                    src={`${concepts}element-${analysis.saju!.dayElement}.webp`}
                    alt=""
                    width="120"
                    height="120"
                  />
                </div>
                <h3>{c.title}</h3>
                <p>{c.common}</p>
                <p className="small muted">{c.difference}</p>
                <blockquote>{c.question}</blockquote>
                <details>
                  <summary>어떤 정보에서 출발했나요?</summary>
                  <p className="small">{c.evidence}</p>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
      {analysis.dream && (
        <section className="concept-section dream-facts">
          <div className="concept-heading">
            <span className="pill">꿈의 단서</span>
            <h2>기억에서 확인한 장면</h2>
            <p>
              {analysis.dream.needsConfirmation
                ? "관계가 모호한 부분은 확정하지 않고 남겨두었어요."
                : "입력과 확인한 단서만 사용했어요."}
            </p>
          </div>
          <div className="tags centered">
            {analysis.dream.symbols.map((s) => (
              <span className="tag lavender" key={s.id}>
                {s.name} · {s.category}
              </span>
            ))}
          </div>
          {analysis.dream.events.map((event, i) => (
            <p key={i} className="dream-event-line">
              {event.actor || "주체 미상"}
              <span>→</span>
              {event.target || "대상 미상"}
              <strong>
                {event.text}
                {event.negated ? " (부정)" : ""}
              </strong>
              {event.confidence === "ambiguous" && <small>관계 미확정</small>}
            </p>
          ))}
          {analysis.dream.unknownFragments.length > 0 && (
            <p className="notice">
              등록되지 않았거나 구분이 필요한 표현:{" "}
              {analysis.dream.unknownFragments.join(" · ")}. 해당 소재의 의미를
              새로 만들지 않았어요.
            </p>
          )}
          <p className="small muted">
            {analysis.image.matchedBy === "category"
              ? "전용 소재 그림이 없어 범주별 기본 삽화를 표시해요."
              : "미리 제작한 정적 삽화이며 꿈의 모든 장면을 재현한 그림은 아니에요."}
          </p>
        </section>
      )}
    </div>
  );
}
