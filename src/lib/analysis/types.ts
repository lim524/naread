export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export type ReviewStatus = "editorial-draft" | "reviewed";
export type ContentMeta = {
  version: string;
  updatedAt: string;
  reviewStatus: ReviewStatus;
  sources: string[];
  interpretation:
    "traditional-symbolism" | "editorial-reflection" | "preference-description";
};
export type DetailSection = { title: string; body: string; ruleId?: string };
export type EvidenceRule = {
  id: string;
  label: string;
  evidence: string;
  interpretation: string;
};
export type Pillar = {
  id: "year" | "month" | "day" | "time";
  label: string;
  ganZhi: string;
  stem: string;
  branch: string;
  stemName: string;
  branchName: string;
  branchReading?: {
    meaning: string;
    detail: string;
    strength: string;
    caution: string;
  };
  element: Element;
  branchElement: Element;
  yinYang: "양" | "음";
  hiddenStems: string[];
  tenGod: string;
  hiddenTenGods: string[];
};
export type SajuAnalysis = {
  meta: ContentMeta;
  pillars: Pillar[];
  dayMaster: string;
  dayMasterName: string;
  dayElement: Element;
  counts: Record<Element, number>;
  yinYang: { yin: number; yang: number };
  season: string;
  rules: EvidenceRule[];
  sections: DetailSection[];
  conventions: string[];
  warnings: string[];
};
export type MbtiLetter = "I" | "E" | "S" | "N" | "T" | "F" | "J" | "P";
export type MbtiAnalysis = {
  meta: ContentMeta;
  type: string;
  source: "self-reported" | "quick-reflection";
  title: string;
  summary: string;
  letters: MbtiLetter[];
  sections: DetailSection[];
};
export type DreamOccurrence = {
  symbolId: string;
  text: string;
  start: number;
  end: number;
  negated: boolean;
};
export type DreamEvent = {
  actionId: string;
  text: string;
  actor: string | null;
  target: string | null;
  confidence: "explicit" | "ambiguous";
  negated: boolean;
};
export type DreamAnalysis = {
  meta: ContentMeta;
  symbols: {
    id: string;
    name: string;
    category: string;
    description: string;
    meaning: string;
    caution: string;
  }[];
  occurrences: DreamOccurrence[];
  attributes: {
    id: string;
    name: string;
    evidence: string;
    symbolId: string | null;
  }[];
  events: DreamEvent[];
  combinations: EvidenceRule[];
  sections: DetailSection[];
  unknownFragments: string[];
  needsConfirmation: boolean;
  image: IllustrationMatch;
};
export type IllustrationMatch = {
  src: string;
  alt: string;
  matchedBy: "combination" | "attribute" | "symbol" | "category";
  illustrationId: string;
};
export type AnalysisBundle = {
  version: string;
  concepts?: {
    elements: typeof import("../datasets/saju").elements;
    preferences: typeof import("../datasets/mbti-preferences").preferences;
  };
  saju: SajuAnalysis | null;
  mbti: MbtiAnalysis | null;
  dream: DreamAnalysis | null;
  missing: ("saju" | "mbti" | "dream")[];
  image: IllustrationMatch;
  connections: {
    letter: MbtiLetter;
    title: string;
    common: string;
    difference: string;
    question: string;
    evidence: string;
  }[];
  mode: "dataset" | "ai-synthesis";
};
