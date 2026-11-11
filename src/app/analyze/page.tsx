import { Suspense } from "react";
import Analyze from "./wizard";
export const metadata = {
  title: "나의 이야기 분석",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense
      fallback={
        <main id="main" className="narrow-page">
          분석 화면을 준비하고 있어요.
        </main>
      }
    >
      <Analyze />
    </Suspense>
  );
}
