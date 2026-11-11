"use client";
import { getReading, deleteReading } from "@/lib/reading-store";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import Reading from "@/components/reading";
import type { SavedReading } from "@/lib/types";
export default function ResultView({ id }: { id: string }) {
  const router = useRouter();
  const [reading, setReading] = useState<SavedReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const localOnly = id.startsWith("local-");
  useEffect(() => {
    let active = true;
    getReading(id)
      .then((saved) => {
        if (!saved)
          throw new Error(
            "이 브라우저에서 결과를 찾을 수 없습니다. 내 결과에서 다시 선택하거나 새로 분석해 주세요.",
          );
        if (active) setReading(saved);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, localOnly]);
  async function remove() {
    setBusy(true);
    try {
      await deleteReading(id);
      router.replace("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <main id="main" className="loading-state">
        <LoaderCircle className="spin" size={18} />
        나의 이야기를 열고 있어요.
      </main>
    );
  return (
    <main id="main" className="narrow-page">
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {reading ? (
        <>
          {localOnly && (
            <div className="notice">
              이 결과는 이 브라우저에 저장되었습니다. 내 결과에서 다시 볼 수
              있습니다.
            </div>
          )}
          <Reading
            reading={reading.result}
            mbti={reading.input.mbti}
            localOnly={localOnly}
          />
          <div className="center" style={{ marginTop: 30 }}>
            {confirm ? (
              <>
                <p className="small muted" style={{ marginBottom: 12 }}>
                  삭제한 결과는 복구할 수 없습니다. 삭제할까요?
                </p>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                >
                  취소
                </button>{" "}
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={remove}
                >
                  {busy ? "삭제 중" : "삭제하기"}
                </button>
              </>
            ) : (
              <button
                className="button secondary"
                onClick={() => setConfirm(true)}
              >
                <Trash2 size={14} />이 결과 삭제
              </button>
            )}
          </div>
        </>
      ) : (
        <Link className="button primary" href="/analyze">
          새로운 이야기 시작하기
        </Link>
      )}
    </main>
  );
}
