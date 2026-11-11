import "server-only";
export { sameOrigin } from "./request-origin";
export function errorResponse(e: unknown, status = 400) {
  return Response.json(
    { error: e instanceof Error ? e.message : "요청을 처리하지 못했습니다." },
    { status },
  );
}
