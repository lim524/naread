"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  activeProfile,
  listReadings,
  selectProfile,
  deleteReading,
  importReadings,
} from "@/lib/reading-store";
import { labels, type SavedReading } from "@/lib/types";
export default function Library() {
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let current = true;
    Promise.all([listReadings(), activeProfile()])
      .then(([rows, profile]) => {
        if (current) {
          setReadings(rows);
          setActive(profile?.id || "");
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);
  async function action(id: string, remove: boolean) {
    setBusy(true);
    setError("");
    try {
      if (remove) await deleteReading(id);
      else await selectProfile(id);
      const [rows, profile] = await Promise.all([
        listReadings(),
        activeProfile(),
      ]);
      setReadings(rows);
      setActive(profile?.id || "");
      setConfirm("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "저장 정보를 변경하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  function backup() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { version: 1, readings, activeProfileId: active },
            null,
            2,
          ),
        ],
        {
          type: "application/json",
        },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "nailgi-results.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function restore(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("10MB 이하의 백업 파일을 선택해 주세요.");
      const parsed = JSON.parse(await file.text());
      if (
        parsed.version !== 1 ||
        !Array.isArray(parsed.readings) ||
        parsed.readings.length > 200
      )
        throw new Error("지원하는 결과 백업 파일이 아닙니다.");
      const [{ inputSchema }, { datasetReading }] = await Promise.all([
        import("@/lib/core"),
        import("@/lib/analysis/engine"),
      ]);
      const restored: SavedReading[] = parsed.readings.map(
        (raw: SavedReading) => {
          const input = inputSchema.parse(raw.input);
          if (
            !/^local-[a-f\d-]{36}$/.test(raw.id) ||
            !Number.isFinite(Date.parse(raw.created_at))
          )
            throw new Error("백업의 결과 정보가 올바르지 않습니다.");
          return {
            id: raw.id,
            kind: input.kind,
            input,
            result: datasetReading(input),
            created_at: new Date(raw.created_at).toISOString(),
          };
        },
      );
      await importReadings(restored);
      if (
        restored.some(
          (r) => r.id === parsed.activeProfileId && r.kind === "comprehensive",
        )
      )
        await selectProfile(parsed.activeProfileId);
      const [rows, profile] = await Promise.all([
        listReadings(),
        activeProfile(),
      ]);
      setReadings(rows);
      setActive(profile?.id || "");
      setMessage(
        `${restored.length}개의 결과를 현재 해석 기준으로 복원했습니다.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "백업을 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="narrow-page">
      <div className="page-heading">
        <h1>내 결과</h1>
        <p>이 브라우저에 보관한 나의 이야기</p>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <label className="field">
        결과 백업 불러오기
        <input
          type="file"
          accept="application/json,.json"
          disabled={busy}
          onChange={(e) => {
            void restore(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {loading ? (
        <p role="status">저장한 결과를 불러오고 있어요.</p>
      ) : (
        <>
          {readings.length ? (
            <>
              <div className="library-actions">
                <button className="button secondary" onClick={backup}>
                  전체 결과 백업
                </button>
                <Link className="button primary" href="/analyze">
                  새 분석
                </Link>
              </div>
              <div className="saved-readings">
                {readings.map((reading) => (
                  <article className="saved-reading" key={reading.id}>
                    <img
                      src={reading.result.analysis?.image.src || "/dragon.webp"}
                      alt=""
                      width="90"
                      height="90"
                    />
                    <div>
                      <span className="overline">
                        {labels[reading.kind]}
                        {reading.id === active ? " · 현재 내 프로필" : ""}
                      </span>
                      <h2>
                        <Link href={`/result/${reading.id}`}>
                          {reading.result.title}
                        </Link>
                      </h2>
                      <p>
                        {reading.input.name} · {reading.created_at.slice(0, 10)}
                      </p>
                      <div className="library-actions">
                        {reading.kind === "comprehensive" &&
                          reading.id !== active && (
                            <button
                              className="button secondary"
                              disabled={busy}
                              onClick={() => action(reading.id, false)}
                            >
                              내 프로필로 사용
                            </button>
                          )}
                        {confirm === reading.id ? (
                          <>
                            <span>이 결과와 연결된 운세를 삭제할까요?</span>
                            <button
                              className="button secondary"
                              disabled={busy}
                              onClick={() => action(reading.id, true)}
                            >
                              삭제 확인
                            </button>
                            <button
                              className="button secondary"
                              onClick={() => setConfirm("")}
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <button
                            className="button secondary"
                            onClick={() => setConfirm(reading.id)}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>아직 저장한 결과가 없습니다.</p>
              <Link className="button primary" href="/analyze">
                나의 이야기 시작하기
              </Link>
            </div>
          )}
          <p className="small muted">
            같은 브라우저에서 다시 볼 수 있습니다. 사이트 데이터를 지우면 사라질
            수 있으니 필요한 결과는 백업해 주세요. 다른 기기와 자동으로
            동기화되지 않습니다.
          </p>
        </>
      )}
    </main>
  );
}
