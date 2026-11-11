# 데이터셋 엔진 검증 · 2026-11-10

## 확인한 결과

- `npm test`: 31개 통과. 원국 고정 예시, 양력/음력/윤달, 절입의 한국 시각 변환, 자정 경계, 시간 미상, 16유형 콘텐츠·분량·중복, 태몽 부정·주체·대상·사용자 수정·조합 방향, 이미지 파일, 외부 호출 0회, 출력 계약, 데이터 스냅샷, SQL 소유권·캐시·이용량·삭제 검증.
- `npm run typecheck`: 통과.
- 최종 `npm run build`: 타입 검사 및 31개 경로 빌드 통과.
- 전체 Playwright: PC·모바일 22개 통과. 이후 수정한 결과 화면과 입력 흐름 10개 재검사 통과. 마지막 지지 상세 설명 추가 후 해당 결과 화면 2개 재검사 통과.
- 실제 로컬 API → 데이터셋 → 결과 화면 완료, 탭 내 새로고침·삭제, 1200×1600 PNG 다운로드의 파일 서명과 크기 확인.
- 오행 버튼과 상생/상극 전환, 네 선호/전체 여덟 선호, 사주–MBTI 연결 카드, 상징 수정, 간이 성향 참고 유형 선택, 모바일 가로 넘침과 깨진 이미지 없음 확인.
- 새 삽화 37종의 원본과 WebP를 저장하고 육안 검수. 부적합 시안은 공개 자산에서 제외.

DB 검사는 PGlite의 실제 PostgreSQL에서 001·002 마이그레이션과 기존 소유권/이용량/삭제 함수를 실행한 결과다. 운영 Supabase 프로젝트에 마이그레이션을 적용한 것은 아니다.

현재 작업 환경에는 Supabase·Gemini 연결 변수가 없으므로 실제 원격 인증·RPC·Gemini 생성·원격 캐시 조회는 검증하지 않았다. AI 출력은 구조 계약과 근거 불일치 거부를 로컬에서 검증했으며 실제 생성 품질을 검증했다고 표시하지 않는다.

운영 연결 전 `supabase/migrations/002_dataset_readings.sql`을 적용하고 `.env.example`의 연결 설정을 완료해야 한다. 전문가 콘텐츠 검토와 역법·자연어 분석의 범위는 `docs/dataset-engine.md`에 별도로 명시했다.

미리보기 파일:

- `test-results/pillars-desktop.png`
- `test-results/pillars-mobile.png`
- `test-results/elements-desktop.png`
- `test-results/elements-mobile.png`
- `public/illustrations/concepts-v1/preview-all.png`
