"use client";
import { useMemo, useState } from "react";
import { parseDream, type DreamCorrection } from "@/lib/analysis/dream-parser";
import { dreamSymbols } from "@/lib/datasets/dream";
export default function DreamConfirmation({
  text,
  correction,
  onChange,
}: {
  text: string;
  correction?: DreamCorrection;
  onChange: (value: DreamCorrection | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const parsed = useMemo(
    () => parseDream(text, correction),
    [text, correction],
  );
  if (text.trim().length < 10) return null;
  const categories = [...new Set(dreamSymbols.map((s) => s.category))];
  const query = search.trim().toLocaleLowerCase();
  const visible = dreamSymbols.filter(
    (s) =>
      (!category || s.category === category) &&
      (!query ||
        [s.name, s.meaning, ...s.synonyms].some((word) =>
          word.toLocaleLowerCase().includes(query),
        )),
  );
  const selected = parsed.symbols.map((s) => s.id);
  const verified = {
    symbolIds: selected,
    events: parsed.events,
    attributes: parsed.attributes.map((a) => ({
      id: a.id,
      symbolId: a.symbolId,
    })),
  };
  function changeEvent(index: number, key: "actor" | "target", value: string) {
    onChange({
      ...verified,
      symbolIds: selected,
      events: parsed.events.map((e, i) => ({
        actionId: e.actionId,
        actor: i === index && key === "actor" ? value || null : e.actor,
        target: i === index && key === "target" ? value || null : e.target,
        negated: e.negated,
      })),
    });
  }
  return (
    <section className="dream-confirmation" aria-label="태몽 자동 인식 확인">
      <h3>이 장면이 맞나요?</h3>
      <p className="small muted">
        자동으로 읽은 단서예요. 빠지거나 잘못 읽은 상징과 행동 관계를 고칠 수
        있어요. 모르는 항목은 비워두세요.
      </p>
      <div className="tags">
        {parsed.symbols.length ? (
          parsed.symbols.map((s) => (
            <span className="tag lavender" key={s.id}>
              {s.name}
            </span>
          ))
        ) : (
          <span className="small">등록된 상징을 찾지 못했어요.</span>
        )}
      </div>
      {parsed.attributes.length > 0 && (
        <p className="small muted">
          속성 단서: {parsed.attributes.map((a) => a.name).join(" · ")}
        </p>
      )}
      {parsed.occurrences.some((o) => o.negated) && (
        <p className="small">등장하지 않았다고 표현한 상징은 제외했어요.</p>
      )}
      {parsed.unknownFragments.length > 0 && (
        <p className="small muted">
          등록 여부나 역할을 확인할 표현: {parsed.unknownFragments.join(" · ")}.
          해석을 만들지 않고 확인을 기다립니다.
        </p>
      )}
      <button
        className="text-link"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "수정 목록 접기" : "인식한 내용 확인·수정"}
      </button>
      {open && (
        <div className="dream-corrections">
          <fieldset>
            <legend>꿈에 실제로 등장한 상징</legend>
            <div className="dream-search-fields">
              <label className="field">
                소재·동의어 검색
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="예: 송아지, 연꽃, 금반지"
                />
              </label>
              <label className="field">
                태몽 소재 카테고리
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">전체 카테고리</option>
                  {categories.map((c) => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="small muted" role="status">
              {visible.length}개 소재 · 선택 {selected.length}개
            </p>
            <div className="symbol-options">
              {visible.map((s) => (
                <label className="checkbox-row" key={s.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(s.id)}
                    disabled={!selected.includes(s.id) && selected.length >= 50}
                    onChange={(e) =>
                      onChange({
                        ...verified,
                        symbolIds: e.target.checked
                          ? [...selected, s.id]
                          : selected.filter((id) => id !== s.id),
                        events: parsed.events,
                      })
                    }
                  />
                  {s.name}
                </label>
              ))}
            </div>
            {!visible.length && (
              <p className="small">
                맞는 소재가 없습니다. 카테고리를 바꾸거나 다른 이름으로 검색해
                주세요.
              </p>
            )}
          </fieldset>
          {parsed.attributes.map((attribute, index) => (
            <div className="field" key={`${attribute.id}-${index}`}>
              <label htmlFor={`dream-attribute-${index}`}>
                {attribute.name}의 대상
              </label>
              <select
                id={`dream-attribute-${index}`}
                value={attribute.symbolId || ""}
                onChange={(e) =>
                  onChange({
                    ...verified,
                    attributes: verified.attributes.map((a, i) =>
                      i === index
                        ? { ...a, symbolId: e.target.value || null }
                        : a,
                    ),
                  })
                }
              >
                <option value="">상징에 연결하지 않음</option>
                {parsed.symbols.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  onChange({
                    ...verified,
                    attributes: verified.attributes.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
              >
                이 속성 제외
              </button>
            </div>
          ))}
          {parsed.events.map((event, i) => (
            <fieldset
              className="event-correction"
              key={`${event.actionId}-${i}`}
            >
              <legend>
                {event.text}
                {event.negated ? " (하지 않은 행동)" : ""}
              </legend>
              <label className="field">
                행동한 주체
                <input
                  maxLength={40}
                  value={event.actor || ""}
                  onChange={(e) => changeEvent(i, "actor", e.target.value)}
                  placeholder="모르면 비워두세요"
                />
              </label>
              <label className="field">
                대상 또는 목적지
                <input
                  maxLength={60}
                  value={event.target || ""}
                  onChange={(e) => changeEvent(i, "target", e.target.value)}
                  placeholder="모르면 비워두세요"
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={event.negated}
                  onChange={(e) =>
                    onChange({
                      ...verified,
                      symbolIds: selected,
                      events: parsed.events.map((item, index) => ({
                        ...item,
                        negated: index === i ? e.target.checked : item.negated,
                      })),
                    })
                  }
                />
                하지 않은 행동이에요
              </label>
            </fieldset>
          ))}
          <button
            className="text-link"
            type="button"
            onClick={() => onChange(undefined)}
          >
            자동 인식으로 되돌리기
          </button>
        </div>
      )}
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={!!correction}
          onChange={(e) => onChange(e.target.checked ? verified : undefined)}
        />
        인식한 내용을 확인했어요
      </label>
    </section>
  );
}
