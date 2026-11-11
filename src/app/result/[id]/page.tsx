import AdSlot from "@/components/ad-slot";
import ResultView from "./view";
export const metadata = {
  title: "나의 분석 결과",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <ResultView id={(await params).id} />
      <AdSlot />
    </>
  );
}
