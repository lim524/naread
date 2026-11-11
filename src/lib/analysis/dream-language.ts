import {
  attributePatterns,
  dreamActions,
  dreamSymbols,
} from "../datasets/dream";
import type { DreamAnalysis, DreamOccurrence } from "./types";
const boundary = /[\s.,!?。;:，、()“”"'~…]/;
const aliases = [
  ...new Map(
    dreamSymbols.flatMap((s) =>
      s.synonyms.map((alias) => [alias, s.id] as const),
    ),
  ).entries(),
]
  .map(([alias, id]) => ({ alias, id }))
  .sort((a, b) => b.alias.length - a.alias.length);
export function negatedAfter(text: string) {
  return (
    /^(?:은|는|이|가|을|를)?\s*(?:아니|없|보이지\s*않|나오지\s*않|안\s*(?:나|보)|지\s*(?:않|못)|하지\s*않)/.test(
      text,
    ) || /^인\s*줄\s*알았(?:는데|더니)/.test(text)
  );
}
export function symbolMatches(text: string): DreamOccurrence[] {
  const matches: DreamOccurrence[] = [];
  for (const { alias, id } of aliases) {
    let at = text.indexOf(alias);
    while (at >= 0) {
      const end = at + alias.length,
        tail = text.slice(end),
        tokenBefore =
          text
            .slice(0, at)
            .split(/[\s.,!?;，、]/)
            .at(-1) || "";
      const before =
        at === 0 ||
        boundary.test(text[at - 1]) ||
        /^(?:(?:황금빛|황금색|황금|금빛|하얀|검은|검정색|붉은|빨간|노란|푸른|커다란|작은|큰|새끼|아기|흰))+$/.test(
          tokenBefore,
        );
      const after =
        end === text.length ||
        boundary.test(text[end]) ||
        /^(?:으로|로|이|가|은|는|을|를|와|과|도|에|의|들|한테|에게|처럼|만|부터|까지|라고|이다|인|였다|랑|하고)/.test(
          tail,
        );
      const clauseEnd = text.slice(end).search(/[.!?;。！？,，]/);
      const local = text.slice(
        Math.max(clauseStart(text, at), at - 18),
        Math.min(clauseEnd < 0 ? text.length : end + clauseEnd, end + 24),
      );
      const effectiveId =
        id === "boat" &&
        alias === "배" &&
        (/(?:과일|열매|배나무)/.test(local) ||
          /^(?:를|는|가)\s*(?:맛있게\s*)?(?:먹|베어|달|익)/.test(tail))
          ? "pear"
          : id;
      const homonym =
        (id === "apple" &&
          (/^(?:했|하|를\s*(?:했|하|드)|의\s*말)/.test(tail) ||
            /(?:미안|잘못|사죄|진심)/.test(local))) ||
        (id === "horse" &&
          /^(?:했|하|씀|을\s*(?:했|하|해|건네|꺼내|듣)|이\s*(?:없|통|맞|나오))/.test(
            tail,
          )) ||
        (id === "eagle" &&
          alias === "수리" &&
          /^(?:했|하|를\s*(?:했|하))/.test(tail)) ||
        (id === "bird" &&
          alias === "새" &&
          /^\s+(?:집|옷|신발|책|차|반지|가방|물건|선물)/.test(tail)) ||
        (effectiveId === "boat" &&
          alias === "배" &&
          !/(?:바다|강|물\s*위|호수|항구|타고|탔|돛|노를|배를\s*타|떠\s*있|항해)/.test(
            local,
          )) ||
        (id === "snow" &&
          alias === "눈" &&
          !/(?:눈이\s*(?:내|왔|쌓)|눈을\s*(?:맞(?!추)|치우)|하얀\s*눈|눈\s*위|눈으로\s*덮|눈밭)/.test(
            local,
          )) ||
        (id === "chestnut" &&
          alias === "밤" &&
          !/(?:밤을\s*(?:먹|줍|주워|주웠|까|받)|밤이\s*(?:열|떨)|밤나무|밤송이)/.test(
            local,
          )) ||
        (id === "persimmon" &&
          alias === "감" &&
          !/(?:감을\s*(?:먹|따|받)|감이\s*(?:열|익)|감나무|홍시)/.test(
            local,
          )) ||
        (id === "dog" &&
          alias === "개" &&
          /(?:한|두|세|네|\d)\s*$/.test(text.slice(0, at))) ||
        (id === "bridge" &&
          alias === "다리" &&
          /(?:다리를\s*(?:다쳤|다치|절|주물)|다리가\s*(?:아프|아팠|길었))/.test(
            local,
          )) ||
        (id === "sheep" &&
          alias === "양" &&
          /^(?:이\s*(?:많|적)|을\s*(?:늘|줄))/.test(tail)) ||
        (id === "sun" &&
          alias === "해" &&
          /(?:한|두|세|지난|다음|올|새|\d)\s*$/.test(text.slice(0, at))) ||
        (id === "egg" && alias === "알" && /^\s*(?:수|것)/.test(tail)) ||
        (id === "rain" &&
          alias === "비" &&
          /^(?:교|밀|상|를\s*들어)/.test(tail));
      if (
        before &&
        after &&
        !homonym &&
        !matches.some((m) => at < m.end && end > m.start)
      )
        matches.push({
          symbolId: effectiveId,
          text: alias,
          start: at,
          end,
          negated: negatedAfter(tail.slice(0, 30)),
        });
      at = text.indexOf(alias, end);
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}
function clauseStart(text: string, index: number) {
  const prefix = text.slice(0, index);
  const separators = [...prefix.matchAll(/[.!?;。！？,，]/g)];
  return separators.length ? separators.at(-1)!.index! + 1 : 0;
}
const moodIds = new Set(["calm", "afraid", "joyful", "wonder"]);
export function readAttributes(
  text: string,
  occurrences: DreamOccurrence[],
  ids: string[],
): DreamAnalysis["attributes"] {
  const result: DreamAnalysis["attributes"] = [];
  for (const definition of attributePatterns)
    for (const match of text.matchAll(new RegExp(definition.pattern, "g"))) {
      const index = match.index!,
        end = index + match[0].length;
      if (negatedAfter(text.slice(end, end + 22))) continue;
      const start = clauseStart(text, index),
        remainder = text.slice(end),
        stop = remainder.search(/[.!?;。！？,，]/),
        finish = stop < 0 ? text.length : end + stop;
      if (
        occurrences.some(
          (o) =>
            o.negated &&
            o.start >= start &&
            o.end <= finish &&
            ((o.start <= index && o.end >= end) ||
              (o.start >= end &&
                o.start - end < 16 &&
                !/(?:은|는|이|가|을|를)\s|(?:고|며|는데)\s/.test(
                  text.slice(end, o.start),
                ))),
        )
      )
        continue;
      const nearby = occurrences.filter(
        (o) =>
          !o.negated &&
          ids.includes(o.symbolId) &&
          o.start >= start &&
          o.end <= finish &&
          Math.min(Math.abs(o.start - index), Math.abs(o.end - index)) <= 24,
      );
      const containing = nearby.find((o) => o.start <= index && o.end >= end);
      const following = nearby.find(
        (o) =>
          o.start >= end &&
          /^[\s가-힣]*$/.test(text.slice(end, o.start)) &&
          !/(?:은|는|이|가|을|를)\s|(?:고|며|는데)\s/.test(
            text.slice(end, o.start),
          ),
      );
      const previous = nearby.filter((o) => o.end <= index).at(-1);
      const owner = containing || following || previous;
      result.push({
        id: definition.id,
        name: definition.name,
        evidence: match[0],
        symbolId: moodIds.has(definition.id) ? null : owner?.symbolId || null,
      });
    }
  return result.filter(
    (a, index) =>
      result.findIndex((b) => a.id === b.id && a.symbolId === b.symbolId) ===
      index,
  );
}
export function readEvents(
  text: string,
  occurrences: DreamOccurrence[],
): DreamAnalysis["events"] {
  const candidates = dreamActions
    .flatMap((a) =>
      [...text.matchAll(new RegExp(a.pattern, "g"))].map((m) => ({
        definition: a,
        index: m.index!,
        end: m.index! + m[0].length,
      })),
    )
    .sort((a, b) => a.index - b.index || b.end - a.end);
  const selected: typeof candidates = [];
  for (const candidate of candidates) {
    const modifier = occurrences.some(
      (o) =>
        o.start >= candidate.end &&
        o.start - candidate.end < 8 &&
        /^(?:는\s*|(?:가|오|나)는\s*|\s*)$/.test(
          text.slice(candidate.end, o.start),
        ) &&
        (text.slice(candidate.index, candidate.end).endsWith("는") ||
          /^(?:는|가는|오는|나는)/.test(text.slice(candidate.end, o.start))),
    );
    if (
      !modifier &&
      !selected.some((a) => candidate.index < a.end && candidate.end > a.index)
    )
      selected.push(candidate);
  }
  return selected.map((candidate, i) => {
    const { definition: a, index, end } = candidate;
    const start = Math.max(
      clauseStart(text, index),
      i > 0 ? selected[i - 1].end : 0,
    );
    const prefix = text.slice(start, index);
    const nouns = [
      ...prefix.matchAll(/([가-힣]+?)(께서|이|가|은|는|을|를)(?=\s|$)/g),
    ]
      .filter(
        (n) =>
          !attributePatterns.some((a) =>
            new RegExp(`^(?:${a.pattern})$`).test(n[0]),
          ),
      )
      .map((n) => ({ word: n[1], particle: n[2], index: start + n.index! }));
    for (const occurrence of occurrences.filter(
      (o) => !o.negated && o.start >= start && o.end <= index,
    )) {
      const particle = text
        .slice(occurrence.end, index)
        .match(/^(이|가|은|는|을|를)/)?.[1];
      if (particle)
        nouns.push({
          word: occurrence.text,
          particle,
          index: occurrence.start,
        });
    }
    nouns.sort((a, b) => a.index - b.index);
    const actor =
      nouns
        .filter((n) => ["이", "가", "은", "는", "께서"].includes(n.particle))
        .at(-1)?.word || null;
    const destination = occurrences
      .filter(
        (o) =>
          !o.negated &&
          o.start >= start &&
          o.end <= index &&
          /^\s*(?:안|속)?(?:으로|로|에)\s*$/.test(text.slice(o.end, index)),
      )
      .at(-1);
    const location = destination
      ? text
          .slice(destination.start, index)
          .replace(/(?:으로|로|에)\s*$/, "")
          .trim()
      : prefix.match(/([가-힣]+?)(?:으로|로|에)\s*$/)?.[1] || null;
    const target =
      (a.id === "enter" ||
      a.id === "leave" ||
      a.id === "rise" ||
      a.id === "descend"
        ? location
        : null) ||
      nouns.filter((n) => ["을", "를"].includes(n.particle)).at(-1)?.word ||
      null;
    const next = selected[i + 1]?.index ?? text.length;
    const clauseEnd = text.slice(end).search(/[.!?;。！？,，]/);
    const after = text.slice(
      index,
      Math.min(next, clauseEnd < 0 ? text.length : end + clauseEnd),
    );
    const negative =
      /지\s*(?:않|못|말)|않았|못했/.test(after) ||
      /(?:^|\s)(?:안|못)\s*$/.test(prefix);
    const intransitive = [
      "fly",
      "run",
      "shine",
      "rise",
      "descend",
      "fall",
      "leave",
      "bloom",
      "swim",
      "hatch",
    ];
    return {
      actionId: a.id,
      text: a.name,
      actor,
      target,
      negated: negative,
      confidence:
        actor && (target || intransitive.includes(a.id))
          ? ("explicit" as const)
          : ("ambiguous" as const),
    };
  });
}
