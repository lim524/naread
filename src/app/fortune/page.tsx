import AdSlot from "@/components/ad-slot";
import FortuneView from "@/components/fortune-panel";
export const metadata = {
  title: "나의 운세",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <FortuneView />
      <AdSlot />
    </>
  );
}
