import "server-only";
import type { AnalysisInput, Reading } from "../types";
export async function persistDatasetReading(
  input: AnalysisInput,
  result: Reading,
) {
  const id = `local-${crypto.randomUUID()}`;
  return {
    id,
    localOnly: true,
    reading: {
      id,
      kind: input.kind,
      input,
      result,
      created_at: new Date().toISOString(),
    },
  };
}
