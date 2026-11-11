"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  activeProfile,
  cachedFortune,
  saveFortune,
  READING_CHANGED,
} from "@/lib/reading-store";
import type { Period, PeriodFortune } from "@/lib/analysis/period-fortune";
import type { SavedReading } from "@/lib/types";
const periods: { id: Period; label: string }[] = [
  { id: "day", label: "오늘의 운세" },
  { id: "week", label: "주간 운세" },
  { id: "month", label: "월간 운세" },
  { id: "year", label: "연간 운세" },
];
export default function FortunePanel() {
  const [period, setPeriod] = useState<Period>("day");
  const [profile, setProfile] = useState<SavedReading>();
  const [fortune, setFortune] = useState<PeriodFortune>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const update = () => setRefresh((n) => n + 1);
    const timer = window.setInterval(update, 60000);
    window.addEventListener("focus", update);
    window.addEventListener(READING_CHANGED, update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener(READING_CHANGED, update);
    };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setFortune(undefined);
    async function load() {
      try {
        const next = await activeProfile();
        if (!active) return;
        setProfile(next);
        if (!next) return;
        const { periodInfo, periodFortune, fortuneVersion } =
          await import("@/lib/analysis/period-fortune");
        const info = periodInfo(period);
        const key = `${next.id}:${fortuneVersion}:${period}:${info.start}`;
        let result = await cachedFortune<PeriodFortune>(key);
        if (!result) {
          result = periodFortune(next, info);
          await saveFortune({ key, profileId: next.id, value: result });
        }
        if (active) setFortune(result);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "운세를 불러오지 못했습니다.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [period, refresh]);
  return (
    <main id="main" className="narrow-page">
      <div className="page-heading">
        <span className="overline">MY PERSONAL RHYTHM</span>
        <h1>나의 운세</h1>
        <p>
          {profile
            ? `${profile.input.name}님의 종합 프로필로 읽는 시간의 흐름`
            : "종합 프로필로 읽는 일간·주간·월간·연간 운세"}
        </p>
      </div>
      {error && (
        <div role="alert" className="error-message">
          {error}
          <button
            className="button secondary"
            onClick={() => setRefresh((n) => n + 1)}
          >
            다시 시도
          </button>
        </div>
      )}
      {!error && !loading && !profile && (
        <section className="empty-state">
          <h2>종합 분석을 먼저 완료해 주세요.</h2>
          <p>
            저장한 사주·MBTI·태몽을 연결해 내 프로필에 맞는 운세를 읽습니다.
          </p>
          <Link className="button primary" href="/analyze?type=comprehensive">
            종합 분석 시작하기
          </Link>
        </section>
      )}
      {profile && (
        <>
          <div className="period-tabs" role="group" aria-label="운세 기간">
            {periods.map((p) => (
              <button
                key={p.id}
                className={`button ${period === p.id ? "primary" : "secondary"}`}
                aria-pressed={period === p.id}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="center small">
            <Link href={`/result/${profile.id}`}>
              기준 프로필: {profile.result.title}
            </Link>
          </p>
        </>
      )}
      {loading && (
        <p role="status" className="center">
          나의 흐름을 읽고 있어요.
        </p>
      )}
      {fortune && !loading && (
        <>
          <section className="fortune-quote">
            <span className="overline">{fortune.info.label}</span>
            <h2>{fortune.theme}</h2>
          </section>
          <div className="fortune-grid">
            {fortune.sections.map((s) => (
              <section className="fortune-card" key={s.title}>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
              </section>
            ))}
          </div>
          <p className="small muted center">
            같은 프로필과 기간의 결과는 유지됩니다. 미래 사건을 확정하는 예측이
            아닌 전통적 상징과 성향에 따른 해석입니다.
          </p>
        </>
      )}
    </main>
  );
}
