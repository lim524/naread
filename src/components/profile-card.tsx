"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  activeProfile,
  listReadings,
  profileNeedsUpdate,
  READING_CHANGED,
} from "@/lib/reading-store";
import type { SavedReading } from "@/lib/types";
export default function ProfileCard() {
  const [profile, setProfile] = useState<SavedReading>();
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [next, readings] = await Promise.all([
          activeProfile(),
          listReadings(),
        ]);
        if (active) {
          setProfile(next);
          setStale(!!next && profileNeedsUpdate(next, readings));
          setError("");
        }
      } catch {
        if (active) setError("저장한 프로필을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    window.addEventListener(READING_CHANGED, load);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.removeEventListener(READING_CHANGED, load);
      window.removeEventListener("focus", load);
    };
  }, []);
  if (loading)
    return (
      <div className="sample-card" role="status">
        내 프로필을 불러오고 있어요.
      </div>
    );
  return (
    <div className="profile-card-wrap">
      <Link
        href={profile ? `/result/${profile.id}` : "/sample"}
        className="sample-card"
      >
        <div className="sample-label">
          {profile
            ? `${profile.input.name}님의 프로필`
            : "미리 만나는 나의 이야기"}
        </div>
        <div className="sample-art">
          <img
            src={profile?.result.analysis?.image.src || "/dragon.webp"}
            alt={
              profile?.result.analysis?.image.alt || "구름 사이의 흑룡 일러스트"
            }
          />
        </div>
        <div className="sample-copy">
          <span className="overline">
            {profile ? "MY PROFILE" : "SAMPLE PROFILE"}
          </span>
          <h2>{profile?.result.title || "흑룡의 탐구자"}</h2>
          <div className="tags">
            {(profile?.result.keywords || ["INTP", "사주", "태몽"]).map(
              (tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className={`tag ${["blue", "peach", "pink"][i % 3]}`}
                >
                  {tag}
                </span>
              ),
            )}
          </div>
          <p>
            {profile?.result.subtitle ||
              "깊은 호기심으로 세상의 원리를 탐구하고, 자신만의 시선으로 의미를 찾아가는 사람."}
          </p>
          <span className="text-link">
            {profile ? "내 종합 결과 보기" : "샘플 결과 자세히 보기"}{" "}
            <ArrowRight size={15} />
          </span>
        </div>
      </Link>
      {stale && (
        <p className="notice">
          새로운 개별 분석이 있습니다.{" "}
          <Link href="/analyze?type=comprehensive">
            새 정보로 다시 종합하기
          </Link>
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
