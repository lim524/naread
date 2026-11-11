import { inputSchema } from "@/lib/core";
import { errorResponse, sameOrigin } from "@/lib/server";
import { datasetReading } from "@/lib/analysis/engine";
import { persistDatasetReading } from "@/lib/analysis/persistence";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const raw = await req.text();
    if (raw.length > 12000) throw new Error("입력 내용이 너무 깁니다.");
    const input = inputSchema.parse(JSON.parse(raw));
    const result = datasetReading(input);
    return Response.json({
      ...(await persistDatasetReading(input, result)),
      result,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
