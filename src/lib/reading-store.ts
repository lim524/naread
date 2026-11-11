import type { Kind, SavedReading } from "./types";
import { STORY_VERSION } from "./story-version";

export const READING_CHANGED = "nailgi-readings-changed";
const DB = "nailgi-library";
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB)
      return reject(
        new Error("이 브라우저에서 결과 저장을 사용할 수 없습니다."),
      );
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("readings", { keyPath: "id" });
      db.createObjectStore("settings");
      db.createObjectStore("fortunes", { keyPath: "key" });
    };
    request.onerror = () =>
      reject(
        new Error(
          "저장 공간을 열지 못했습니다. 브라우저 설정을 확인해 주세요.",
        ),
      );
    request.onblocked = () =>
      reject(new Error("다른 탭을 닫고 다시 시도해 주세요."));
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}
async function transaction<T>(
  stores: string[],
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction, set: (value: T) => void) => void,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let value: T;
    tx.oncomplete = () => {
      db.close();
      resolve(value);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        new Error(
          "결과를 저장하거나 불러오지 못했습니다. 저장 공간을 확인해 주세요.",
        ),
      );
    };
    try {
      run(tx, (next) => {
        value = next;
      });
    } catch (error) {
      tx.abort();
      reject(error);
    }
  });
}
async function updateStories(
  readings: SavedReading[],
): Promise<SavedReading[]> {
  const outdated = readings.filter(
    (r) => r.result.analysis && r.result.storyVersion !== STORY_VERSION,
  );
  if (!outdated.length) return readings;
  const { storyReading } = await import("./analysis/story-reading");
  const updated = new Map(
    outdated.map((r) => [
      r.id,
      { ...r, result: storyReading(r.input, r.result) },
    ]),
  );
  await transaction<void>(["readings"], "readwrite", (tx) => {
    for (const row of updated.values())
      tx.objectStore("readings").get(row.id).onsuccess = (event) => {
        const current = (event.target as IDBRequest<SavedReading>).result;
        if (
          current &&
          current.result.storyVersion !== STORY_VERSION &&
          JSON.stringify(current.input) === JSON.stringify(row.input)
        )
          tx.objectStore("readings").put(row);
      };
  });
  return readings.map((r) => updated.get(r.id) || r);
}
export async function listReadings(): Promise<SavedReading[]> {
  const readings = await transaction<SavedReading[]>(
    ["readings"],
    "readonly",
    (tx, set) => {
      tx.objectStore("readings").getAll().onsuccess = (e) =>
        set(
          (e.target as IDBRequest<SavedReading[]>).result.sort(
            (a, b) =>
              b.created_at.localeCompare(a.created_at) ||
              b.id.localeCompare(a.id),
          ),
        );
    },
  );
  return updateStories(readings);
}
export async function saveReading(reading: SavedReading) {
  await transaction<void>(["readings", "settings"], "readwrite", (tx) => {
    tx.objectStore("readings").put(reading);
    if (reading.kind === "comprehensive")
      tx.objectStore("settings").put(reading.id, "activeProfile");
  });
  window.dispatchEvent(new Event(READING_CHANGED));
}
export async function importReadings(readings: SavedReading[]) {
  const ordered = [...readings].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  await transaction<void>(
    ["readings", "settings", "fortunes"],
    "readwrite",
    (tx) => {
      const ids = new Set(ordered.map((r) => r.id));
      tx.objectStore("fortunes").openCursor().onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (!cursor) return;
        if (ids.has(cursor.value.profileId)) cursor.delete();
        cursor.continue();
      };
      for (const reading of ordered) {
        tx.objectStore("readings").put(reading);
        if (reading.kind === "comprehensive")
          tx.objectStore("settings").put(reading.id, "activeProfile");
      }
    },
  );
  window.dispatchEvent(new Event(READING_CHANGED));
}
export async function getReading(
  id: string,
): Promise<SavedReading | undefined> {
  const saved = await transaction<SavedReading | undefined>(
    ["readings"],
    "readonly",
    (tx, set) => {
      tx.objectStore("readings").get(id).onsuccess = (e) =>
        set((e.target as IDBRequest<SavedReading>).result);
    },
  );
  if (saved) return (await updateStories([saved]))[0];
  // One-time migration for results created before IndexedDB was introduced.
  const raw = sessionStorage.getItem(`nailgi:local:${id}`);
  if (!raw) return undefined;
  const legacy = JSON.parse(raw) as SavedReading;
  if (legacy.id !== id || !legacy.input || !legacy.result) return undefined;
  const { storyReading } = await import("./analysis/story-reading");
  legacy.result = storyReading(legacy.input, legacy.result);
  await saveReading(legacy);
  sessionStorage.removeItem(`nailgi:local:${id}`);
  return legacy;
}
export async function activeProfile(): Promise<SavedReading | undefined> {
  const profile = await transaction<SavedReading | undefined>(
    ["settings", "readings"],
    "readonly",
    (tx, set) => {
      tx.objectStore("settings").get("activeProfile").onsuccess = (event) => {
        const id = (event.target as IDBRequest<string>).result;
        if (!id) return set(undefined);
        tx.objectStore("readings").get(id).onsuccess = (e) => {
          const reading = (e.target as IDBRequest<SavedReading>).result;
          set(reading?.kind === "comprehensive" ? reading : undefined);
        };
      };
    },
  );
  return profile ? (await updateStories([profile]))[0] : undefined;
}
export async function selectProfile(id: string) {
  const reading = await getReading(id);
  if (reading?.kind !== "comprehensive")
    throw new Error("종합 결과만 내 프로필로 지정할 수 있습니다.");
  await transaction<void>(["settings"], "readwrite", (tx) => {
    tx.objectStore("settings").put(id, "activeProfile");
  });
  window.dispatchEvent(new Event(READING_CHANGED));
}
export async function deleteReading(id: string) {
  await transaction<void>(
    ["readings", "settings", "fortunes"],
    "readwrite",
    (tx) => {
      tx.objectStore("readings").delete(id);
      tx.objectStore("settings").get("activeProfile").onsuccess = (e) => {
        if ((e.target as IDBRequest<string>).result === id)
          tx.objectStore("settings").delete("activeProfile");
      };
      tx.objectStore("fortunes").openCursor().onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (!cursor) return;
        if (cursor.value.profileId === id) cursor.delete();
        cursor.continue();
      };
    },
  );
  sessionStorage.removeItem(`nailgi:local:${id}`);
  window.dispatchEvent(new Event(READING_CHANGED));
}
export type CachedFortune<T> = { key: string; profileId: string; value: T };
export async function cachedFortune<T>(key: string): Promise<T | undefined> {
  return transaction(["fortunes"], "readonly", (tx, set) => {
    tx.objectStore("fortunes").get(key).onsuccess = (e) =>
      set((e.target as IDBRequest<CachedFortune<T>>).result?.value);
  });
}
export async function saveFortune<T>(entry: CachedFortune<T>) {
  // Never resurrect a cache after its source profile has been deleted.
  return transaction<void>(["fortunes", "readings"], "readwrite", (tx) => {
    tx.objectStore("readings").get(entry.profileId).onsuccess = (e) => {
      if ((e.target as IDBRequest).result)
        tx.objectStore("fortunes").put(entry);
    };
  });
}
export function profileNeedsUpdate(
  profile: SavedReading,
  readings: SavedReading[],
) {
  const fields: Record<Exclude<Kind, "comprehensive">, string[]> = {
    saju: ["birthDate", "birthTime", "unknownTime", "calendar", "leapMonth"],
    mbti: ["mbti", "mbtiSource"],
    dream: ["dream", "dreamCorrection"],
  };
  return Object.entries(fields).some(([kind, keys]) => {
    const latest = readings.find((r) => r.kind === kind);
    return (
      latest &&
      latest.created_at > profile.created_at &&
      keys.some(
        (key) =>
          JSON.stringify(latest.input[key as keyof typeof latest.input]) !==
          JSON.stringify(profile.input[key as keyof typeof profile.input]),
      )
    );
  });
}
