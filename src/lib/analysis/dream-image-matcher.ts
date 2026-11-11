import catalog from "../../../public/illustrations/collection-v1/catalog.json";
import conceptCatalog from "../../../public/illustrations/concepts-v1/catalog.json";
import { symbolById } from "../datasets/dream";
import type { Element, IllustrationMatch } from "./types";
const registered = new Map(catalog.assets.map((a) => [a.id, a]));
const conceptRegistered = new Map(conceptCatalog.assets.map((a) => [a.id, a]));
export function matchDreamImage(
  ids: string[],
  attributes: { id: string; symbolId: string | null }[],
  fallback: Element = "water",
  combinationIds: string[] = [],
): IllustrationMatch {
  const primary = ids.map((id) => symbolById[id]).find((s) => s?.imageId);
  const animal = primary?.imageId;
  const colors: Record<string, Element> = {
    black: "water",
    white: "metal",
    gold: "earth",
    green: "wood",
    red: "fire",
  };
  const attribute =
    primary &&
    attributes.find((a) => a.symbolId === primary.id && colors[a.id]);
  const element = attribute ? colors[attribute.id] : fallback;
  for (const id of combinationIds) {
    const entry = conceptRegistered.get(`combo-${id}`);
    const compatible =
      !attribute || (id === "dragon-pearl" && attribute.id === "black");
    if (entry && compatible)
      return {
        src: entry.src,
        alt:
          id === "dragon-pearl"
            ? "여의주를 문 용의 수묵화"
            : "집의 문 안으로 들어가는 호랑이 수묵화",
        illustrationId: entry.id,
        matchedBy: "combination",
      };
  }
  if (animal) {
    const exact = conceptRegistered.get(animal);
    if (exact)
      return {
        src: exact.src,
        alt: `${primary.name}의 수채화`,
        illustrationId: exact.id,
        matchedBy: "symbol",
      };
    const entry =
      registered.get(`${animal}-${element}`) ||
      registered.get(`${animal}-water`);
    if (entry)
      return {
        src: entry.src,
        alt: `${primary.name}의 수묵화 · ${entry.name}`,
        illustrationId: entry.id,
        matchedBy: attribute ? "attribute" : "symbol",
      };
  }
  const category = ids.map((id) => symbolById[id]?.category).find(Boolean);
  const concept =
    category === "과일·열매" ||
    category === "꽃·식물" ||
    category === "곡식·먹거리"
      ? "wood"
      : category === "보석·귀중품"
        ? "metal"
        : category === "하늘·천체" || category === "불·빛"
          ? "fire"
          : category === "물·날씨" || category === "수생생물"
            ? "water"
            : fallback;
  return {
    src: `/illustrations/concepts-v1/element-${concept}.webp`,
    alt: "등록된 전용 이미지가 없어 표시하는 범주별 기본 수채화",
    illustrationId: `element-${concept}`,
    matchedBy: "category",
  };
}
