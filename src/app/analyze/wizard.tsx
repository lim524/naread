"use client";
import { saveReading, listReadings } from "@/lib/reading-store";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CategoryIcon, Note } from "@/components/ui";
import { kinds, labels, type Kind, type AnalysisInput } from "@/lib/types";
import { inputSchema } from "@/lib/core";
import dynamic from "next/dynamic";
import type { DreamCorrection } from "@/lib/analysis/dream-parser";
const DreamConfirmation = dynamic(
  () => import("@/components/dream-confirmation"),
);
const PreferenceQuiz = dynamic(() => import("@/components/preference-quiz"));
const mbtis = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];
export default function Analyze() {
  const router = useRouter();
  const query = useSearchParams().get("type");
  const [kind, setKind] = useState<Kind>(
    kinds.includes(query as Kind) ? (query as Kind) : "comprehensive",
  );
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    unknownTime: false,
    calendar: "solar" as "solar" | "lunar",
    leapMonth: false,
    mbti: "",
    dream: "",
    unknownMbti: false,
    unknownDream: false,
    introduction: "",
    unknownSaju: false,
    mbtiSource: "self-reported" as "self-reported" | "quick-reflection",
    dreamCorrection: undefined as DreamCorrection | undefined,
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const touched = useRef(false);
  useEffect(() => {
    let active = true;
    listReadings()
      .then((readings) => {
        if (!active || touched.current || !readings.length) return;
        const latest = (kind: Kind) =>
          readings.find((r) => r.kind === kind || r.kind === "comprehensive")
            ?.input;
        const profile = latest("comprehensive");
        const saju = latest("saju") || profile,
          mbti = latest("mbti") || profile,
          dream = latest("dream") || profile;
        setData((previous) => ({
          ...previous,
          name: readings[0].input.name,
          ...(saju
            ? {
                birthDate: saju.birthDate,
                birthTime: saju.birthTime,
                unknownTime: saju.unknownTime,
                calendar: saju.calendar,
                leapMonth: saju.leapMonth,
                unknownSaju: !!saju.unknownSaju,
              }
            : {}),
          ...(mbti
            ? {
                mbti: mbti.mbti,
                mbtiSource: mbti.mbtiSource || "self-reported",
                unknownMbti: !!mbti.unknownMbti,
              }
            : {}),
          ...(dream
            ? {
                dream: dream.dream,
                dreamCorrection: dream.dreamCorrection,
                unknownDream: !!dream.unknownDream,
              }
            : {}),
        }));
      })
      .catch(() => {
        /* Analysis remains available when no saved input can be read. */
      });
    return () => {
      active = false;
    };
  }, []);
  const set = (key: string, value: unknown) => {
    touched.current = true;
    setData((d) => ({ ...d, [key]: value }));
  };
  const flow = kind === "comprehensive" ? ["saju", "mbti", "dream"] : [kind];
  const current = flow[step];
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step < flow.length - 1) {
      const skipUnknownMbti =
        kind === "comprehensive" &&
        ((current === "mbti" && data.unknownMbti) ||
          (current === "saju" && data.unknownSaju));
      if (!skipUnknownMbti) {
        const validation = inputSchema.safeParse({ ...data, kind: current });
        if (!validation.success) {
          setError(validation.error.issues[0].message);
          return;
        }
      }
      setStep(step + 1);
      return;
    }
    const input: AnalysisInput = { kind, ...data };
    const validation = inputSchema.safeParse(input);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    if (!consent) {
      setError("분석을 위한 정보 처리에 동의해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(
        kind === "comprehensive" ? "/api/analyze" : "/api/analyze/individual",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validation.data),
        },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await saveReading(d.reading);
      router.push("/result/" + d.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="form-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={15} /> 처음으로
      </Link>
      <div className="page-heading">
        <span className="overline">LET’S READ YOUR STORY</span>
        <h1>당신의 이야기를 들려주세요.</h1>
        <p>작은 단서들이 모여, 새로운 나를 발견합니다.</p>
      </div>
      <div className="analysis-tabs" aria-label="분석 종류">
        {kinds.map((k) => (
          <button
            key={k}
            className={kind === k ? "selected" : ""}
            onClick={() => {
              setKind(k);
              setStep(0);
              setData((d) => ({
                ...d,
                unknownMbti: false,
                unknownDream: false,
                unknownSaju: false,
              }));
              setError("");
            }}
            disabled={busy}
          >
            <CategoryIcon kind={k} />
            <span>{labels[k]}</span>
          </button>
        ))}
      </div>
      <div className="form-panel">
        <div className="form-progress">
          <span>{labels[kind]}</span>
          <span>
            STEP {step + 1} <span className="muted">/ {flow.length}</span>
          </span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${((step + 1) / flow.length) * 100}%` }} />
        </div>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <div className="form-section-heading">
              <CategoryIcon kind={current as Kind} />
              <div>
                <h2>
                  {current === "saju"
                    ? "태어난 순간을 알려주세요."
                    : current === "mbti"
                      ? "어떤 성격을 가지고 있나요?"
                      : "태어나기 전, 어떤 꿈이 있었나요?"}
                </h2>
                <p>
                  {current === "saju"
                    ? "생년월일과 시간을 바탕으로 사주를 읽어요."
                    : current === "mbti"
                      ? "내가 알고 있는 성격 유형을 선택해 주세요."
                      : "기억 속 태몽의 상징을 이야기로 풀어드려요."}
                </p>
              </div>
            </div>
            <label className="field">
              어떻게 불러드릴까요?
              <input
                name="name"
                required
                maxLength={30}
                value={data.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="이름 또는 별칭"
                autoComplete="nickname"
              />
            </label>
            {current === "saju" && (
              <>
                {kind === "comprehensive" && (
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={data.unknownSaju}
                      onChange={(e) => set("unknownSaju", e.target.checked)}
                    />
                    생년월일을 몰라 사주를 제외할게요
                  </label>
                )}
                <fieldset
                  disabled={kind === "comprehensive" && data.unknownSaju}
                >
                  <div className="field">
                    <span>생년월일</span>
                    <div className="segmented">
                      {(["solar", "lunar"] as const).map((v) => (
                        <button
                          type="button"
                          key={v}
                          className={data.calendar === v ? "selected" : ""}
                          onClick={() => set("calendar", v)}
                        >
                          {v === "solar" ? "양력" : "음력"}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="예: 19950423 (숫자 8자리)"
                      maxLength={8}
                      pattern="[0-9]{8}"
                      aria-label="생년월일"
                      required={!(kind === "comprehensive" && data.unknownSaju)}
                      value={data.birthDate.replace(/-/g, "")}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 8);
                        set(
                          "birthDate",
                          digits.length === 8
                            ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
                            : digits,
                        );
                      }}
                    />
                    {data.calendar === "lunar" && (
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={data.leapMonth}
                          onChange={(e) => set("leapMonth", e.target.checked)}
                        />{" "}
                        윤달이에요
                      </label>
                    )}
                  </div>
                  <label className="field">
                    태어난 시간
                    <input
                      type="time"
                      disabled={data.unknownTime}
                      required={!data.unknownTime && !data.unknownSaju}
                      value={data.birthTime}
                      onChange={(e) => set("birthTime", e.target.value)}
                    />
                  </label>
                </fieldset>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={data.unknownTime}
                    onChange={(e) => set("unknownTime", e.target.checked)}
                  />{" "}
                  태어난 시간을 몰라요{" "}
                  <span className="muted small">
                    (시주를 제외하고 분석합니다)
                  </span>
                </label>
              </>
            )}
            {current === "mbti" && (
              <div className="field">
                <span>나의 MBTI</span>
                <div className="mbti-grid">
                  {mbtis.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={!data.unknownMbti && data.mbti === m}
                      className={
                        !data.unknownMbti && data.mbti === m ? "selected" : ""
                      }
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          mbti: m,
                          unknownMbti: false,
                          mbtiSource: "self-reported",
                        }))
                      }
                    >
                      {m}
                      {!data.unknownMbti && data.mbti === m && (
                        <Check size={13} />
                      )}
                    </button>
                  ))}
                </div>
                {kind === "comprehensive" && (
                  <>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={data.unknownMbti}
                        onChange={(e) => set("unknownMbti", e.target.checked)}
                      />
                      MBTI를 몰라요
                    </label>
                    <p className="small muted">
                      모르면 선택해 주세요. MBTI를 추측하지 않고 알고 있는
                      정보만으로 분석해요.
                    </p>
                  </>
                )}
                <p className="small muted">
                  공식 MBTI 검사가 아닙니다. 알고 있는 유형을 활용한 자기 이해
                  콘텐츠예요.
                </p>
                <PreferenceQuiz
                  onSelect={(type) =>
                    setData((d) => ({
                      ...d,
                      mbti: type,
                      unknownMbti: false,
                      mbtiSource: "quick-reflection",
                    }))
                  }
                />
              </div>
            )}
            {current === "dream" && (
              <>
                <label className="field">
                  기억나는 태몽
                  <textarea
                    rows={6}
                    minLength={10}
                    maxLength={2000}
                    required={!(kind === "comprehensive" && data.unknownDream)}
                    disabled={kind === "comprehensive" && data.unknownDream}
                    value={data.dream}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        dream: e.target.value,
                        dreamCorrection: undefined,
                      }))
                    }
                    placeholder="예: 할머니께서 금반지를 건네주셨고, 맑은 물에서는 황금빛 잉어가 헤엄쳤대요. 또는 커다란 석류를 받거나 연꽃이 피어나는 장면처럼 기억나는 대상을 적어주세요."
                  />
                  <span className="small muted">
                    {kind === "comprehensive" && data.unknownDream
                      ? "태몽 해석은 제외하고 알고 있는 정보만으로 분석해요."
                      : `동물·열매·꽃·보석·날씨·사람 등 무엇이 어디에서 어떤 행동을 했는지 적어주세요. ${data.dream.length}/2000`}
                  </span>
                </label>
                {kind === "comprehensive" && (
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={data.unknownDream}
                      onChange={(e) => set("unknownDream", e.target.checked)}
                    />
                    태몽을 모르거나 기억나지 않아요
                  </label>
                )}
                {!(kind === "comprehensive" && data.unknownDream) && (
                  <DreamConfirmation
                    text={data.dream}
                    correction={data.dreamCorrection}
                    onChange={(value) => set("dreamCorrection", value)}
                  />
                )}
              </>
            )}
            {step === flow.length - 1 && (
              <>
                <label className="checkbox-row consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    <Link href="/privacy" target="_blank">
                      개인정보처리방침
                    </Link>
                    을 확인했으며, 입력한 정보의 분석과 결과 저장에 동의합니다.
                    결과는 이 브라우저에 보관됩니다.
                  </span>
                </label>
              </>
            )}
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            <div className="form-buttons">
              {step > 0 && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setStep(step - 1);
                    setError("");
                  }}
                >
                  <ArrowLeft size={17} />
                  이전
                </button>
              )}
              <button className="button primary" type="submit">
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={18} />
                    나의 이야기를 읽고 있어요
                  </>
                ) : step < flow.length - 1 ? (
                  <>
                    다음으로
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    나의 이야기 분석하기
                  </>
                )}
              </button>
            </div>
            {busy && (
              <p className="center muted small" role="status">
                최대 1분 정도 걸릴 수 있어요. 화면을 닫지 않고 기다려 주세요.
              </p>
            )}
          </fieldset>
        </form>
      </div>
      <div className="privacy-note">
        <ShieldCheck size={16} /> 입력하신 정보는 분석 목적으로만 사용합니다.
      </div>
      <Note />
    </main>
  );
}
