import { notFound } from "next/navigation";
import Link from "next/link";
import { policies } from "@/lib/policies";
export function generateStaticParams() {
  return Object.keys(policies).map((page) => ({ page }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const p = policies[page];
  return {
    title: p?.title,
    description: p?.description,
    alternates: { canonical: `/${page}` },
  };
}
export default async function Policy({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const p = policies[page];
  if (!p) notFound();
  return (
    <main id="main" className="policy-page">
      <span className="overline">NAILGI · OUR PROMISE</span>
      <h1 style={{ marginTop: 16 }}>{p.title}</h1>
      <p className="muted">{p.description}</p>
      {p.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.title}</h2>
          <p>{s.body}</p>
        </section>
      ))}
      <div className="notice">
        궁금한 점이 있으신가요? <Link href="/contact">문의 안내</Link>를 확인해
        주세요.
      </div>
    </main>
  );
}
