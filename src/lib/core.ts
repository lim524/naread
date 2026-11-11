import { z } from "zod";
import { Lunar } from "lunar-typescript";
export function koreaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export const inputSchema = z
  .object({
    kind: z.enum(["saju", "mbti", "dream", "comprehensive"]),
    name: z.string().trim().min(1).max(30),
    birthDate: z.string().default(""),
    birthTime: z.string().default(""),
    unknownTime: z.boolean().default(false),
    calendar: z.enum(["solar", "lunar"]).default("solar"),
    leapMonth: z.boolean().default(false),
    mbti: z.string().default(""),
    dream: z.string().max(2000).default(""),
    unknownMbti: z.boolean().default(false),
    unknownDream: z.boolean().default(false),
    introduction: z.string().trim().max(200).default(""),
    unknownSaju: z.boolean().default(false),
    mbtiSource: z
      .enum(["self-reported", "quick-reflection"])
      .default("self-reported"),
    dreamCorrection: z
      .object({
        symbolIds: z.array(z.string().max(40)).max(50),
        attributes: z
          .array(
            z.object({
              id: z.string().max(30),
              symbolId: z.string().max(40).nullable(),
            }),
          )
          .max(30)
          .optional(),
        events: z
          .array(
            z.object({
              actionId: z.string().max(30),
              actor: z.string().max(40).nullable(),
              target: z.string().max(60).nullable(),
              negated: z.boolean(),
            }),
          )
          .max(30)
          .optional(),
      })
      .optional(),
  })
  .superRefine((v, c) => {
    if (
      ["saju", "comprehensive"].includes(v.kind) &&
      !(v.kind === "comprehensive" && v.unknownSaju)
    ) {
      const d = new Date(v.birthDate + "T12:00:00+09:00");
      let validLunar = false;
      if (v.calendar === "lunar" && /^\d{4}-\d{2}-\d{2}$/.test(v.birthDate)) {
        try {
          const [y, m, day] = v.birthDate.split("-").map(Number);
          const l = Lunar.fromYmdHms(y, v.leapMonth ? -m : m, day, 12, 0, 0);
          validLunar =
            l.getYear() === y &&
            l.getMonth() === (v.leapMonth ? -m : m) &&
            l.getDay() === day &&
            l.getSolar().toYmd() <= koreaDate();
        } catch {
          validLunar = false;
        }
      }
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(v.birthDate) ||
        v.birthDate < "1900-01-01" ||
        (v.calendar === "lunar"
          ? !validLunar
          : Number.isNaN(+d) ||
            v.birthDate > koreaDate() ||
            koreaDate(d) !== v.birthDate)
      )
        c.addIssue({
          code: "custom",
          message: "올바른 생년월일을 입력해 주세요.",
        });
      if (!v.unknownTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.birthTime))
        c.addIssue({
          code: "custom",
          message: "태어난 시간을 입력하거나 시간 모름을 선택해 주세요.",
        });
    }
    if (
      ["mbti", "comprehensive"].includes(v.kind) &&
      !(v.kind === "comprehensive" && v.unknownMbti) &&
      !/^(E|I)(S|N)(T|F)(J|P)$/.test(v.mbti)
    )
      c.addIssue({ code: "custom", message: "MBTI 유형을 선택해 주세요." });
    if (
      ["dream", "comprehensive"].includes(v.kind) &&
      !(v.kind === "comprehensive" && v.unknownDream) &&
      v.dream.trim().length < 10
    )
      c.addIssue({
        code: "custom",
        message: "기억나는 태몽을 10자 이상 적어 주세요.",
      });
    if (
      v.kind === "comprehensive" &&
      v.unknownSaju &&
      v.unknownMbti &&
      v.unknownDream
    )
      c.addIssue({
        code: "custom",
        message: "알고 있는 분석 정보를 하나 이상 입력해 주세요.",
      });
  })
  .transform((v) => {
    const unknownMbti = v.kind === "comprehensive" && v.unknownMbti;
    const unknownDream = v.kind === "comprehensive" && v.unknownDream;
    return {
      ...v,
      unknownMbti,
      unknownDream,
      unknownSaju: v.kind === "comprehensive" && v.unknownSaju,
      birthDate: v.kind === "comprehensive" && v.unknownSaju ? "" : v.birthDate,
      birthTime: v.kind === "comprehensive" && v.unknownSaju ? "" : v.birthTime,
      mbti: unknownMbti ? "" : v.mbti,
      dream: unknownDream ? "" : v.dream,
      introduction: v.kind === "comprehensive" ? v.introduction : "",
    };
  });
export const readingSchema = z.object({
  title: z.string().min(1).max(80),
  subtitle: z.string().max(150),
  summary: z.string().min(20).max(2000),
  keywords: z.array(z.string().max(30)).min(1).max(6),
  sections: z
    .array(
      z.object({
        title: z.string().max(80),
        body: z.string().min(10).max(2000),
      }),
    )
    .min(3)
    .max(50),
  advice: z.string().max(1000),
});
export const fortuneSchema = z.object({
  message: z.string().min(5).max(160),
  overall: z.string().min(10).max(1000),
  money: z.string().min(10).max(1000),
  love: z.string().min(10).max(1000),
  relationships: z.string().min(10).max(1000),
  work: z.string().min(10).max(1000),
  advice: z.string().min(10).max(1000),
  color: z.string().max(30),
  number: z.number().int().min(1).max(99),
});
