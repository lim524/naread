import { symbolMatches, readAttributes, readEvents } from "./dream-language";
import { dreamSections } from "./dream-reading";
import {
  attributePatterns,
  combinationDefinitions,
  dreamActions,
  dreamMeta,
  symbolById,
} from "../datasets/dream";
import type { DreamAnalysis } from "./types";
import { matchDreamImage } from "./dream-image-matcher";
export type DreamCorrection = {
  symbolIds: string[];
  attributes?: { id: string; symbolId: string | null }[];
  events?: {
    actionId: string;
    actor: string | null;
    target: string | null;
    negated: boolean;
  }[];
};
export function parseDream(
  raw: string,
  correction?: DreamCorrection,
): DreamAnalysis {
  const text = raw
    .normalize("NFC")
    .replace(/\r?\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
  const occurrences = symbolMatches(text);
  let ids = [
    ...new Set(occurrences.filter((o) => !o.negated).map((o) => o.symbolId)),
  ];
  if (correction) {
    if (correction.symbolIds.some((id) => !Object.hasOwn(symbolById, id)))
      throw new Error("등록되지 않은 상징은 확인 목록에 추가할 수 없습니다.");
    ids = [...new Set(correction.symbolIds)];
  }
  let attributes = readAttributes(text, occurrences, ids);
  if (correction?.attributes) {
    const inferred = attributes;
    attributes = correction.attributes.map((item) => {
      const definition = attributePatterns.find((a) => a.id === item.id);
      if (!definition) throw new Error("등록되지 않은 속성입니다.");
      return {
        id: item.id,
        name: definition.name,
        symbolId:
          item.symbolId && ids.includes(item.symbolId) ? item.symbolId : null,
        evidence:
          inferred.find((a) => a.id === item.id)?.evidence ||
          "사용자가 확인한 속성",
      };
    });
  }
  let events = readEvents(text, occurrences);
  if (correction?.events)
    events = correction.events.map((e) => {
      const action = dreamActions.find((a) => a.id === e.actionId);
      if (!action) throw new Error("등록되지 않은 행동입니다.");
      return {
        ...e,
        text: action.name,
        confidence: e.actor ? "explicit" : "ambiguous",
      };
    });
  const combinations: DreamAnalysis["combinations"] = [];
  for (const c of combinationDefinitions) {
    if (!c.symbols.every((id) => ids.includes(id))) continue;
    const roleHas = (role: string | null, id: string) =>
      !!role &&
      symbolMatches(role).some((o) => o.symbolId === id && !o.negated);
    const event = events.find((e) => {
      if (e.actionId !== c.action || e.negated || e.confidence !== "explicit")
        return false;
      return c.id === "dragon-pearl"
        ? roleHas(e.actor, "dragon") && roleHas(e.target, "pearl")
        : c.id === "tiger-house"
          ? roleHas(e.actor, "tiger") && roleHas(e.target, "house")
          : c.id === "pig-hug"
            ? roleHas(e.actor, "pig") || roleHas(e.target, "pig")
            : c.id === "peach-eat"
              ? roleHas(e.target, "peach") && !roleHas(e.actor, "peach")
              : c.id === "fish-catch"
                ? roleHas(e.target, "fish") && !roleHas(e.actor, "fish")
                : ["swim", "bloom", "hatch"].includes(c.action)
                  ? roleHas(e.actor, c.symbols[0])
                  : roleHas(e.target, c.symbols[0]) &&
                    !roleHas(e.actor, c.symbols[0]);
    });
    if (!event) continue;
    combinations.push({
      id: c.id,
      label: c.title,
      evidence: `${c.symbols.map((id) => symbolById[id].name).join(" + ")} / ${event.actor || "주체 미상"} → ${event.target || "대상 미상"} / ${event.text}`,
      interpretation: c.body,
    });
  }
  const known = ids.map((id) => symbolById[id]);
  const unknownFragments = [...text.matchAll(/([가-힣]{2,})(?:이|가|을|를)\s/g)]
    .map((m) => m[1])
    .filter(
      (word) =>
        !occurrences.some((o) => o.text.endsWith(word)) &&
        !symbolMatches(word).some((o) => ids.includes(o.symbolId)) &&
        !known.some((s) => s.synonyms.includes(word)) &&
        !/^(?:엄마|어머니|아버지|아빠|할머니|할아버지|우리|자신|사람|누군가|뱃속|꿈|기억|생각)$/.test(
          word,
        ),
    );
  const needsConfirmation =
    !known.length ||
    events.some((e) => e.confidence === "ambiguous") ||
    unknownFragments.length > 0 ||
    occurrences.some((o) => o.negated) ||
    !correction;
  return {
    meta: dreamMeta,
    occurrences,
    symbols: known.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      meaning: s.meaning,
      caution: s.caution,
    })),
    attributes,
    events,
    combinations,
    unknownFragments: [...new Set(unknownFragments)],
    needsConfirmation,
    image: matchDreamImage(
      ids,
      attributes,
      "water",
      combinations.map((c) => c.id),
    ),
    sections: dreamSections(known, attributes, events, combinations),
  };
}
