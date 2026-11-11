"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  const links = [
    ["/analyze", "분석"],
    ["/fortune", "나의 운세"],
    ["/results", "내 결과"],
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo" aria-label="나읽기 홈">
          나읽기<span>.</span>
        </Link>
        <span className="header-divider" />
        <span className="brand-caption">사주와 성향으로 읽는 나의 이야기</span>
        <nav className={open ? "nav open" : "nav"} aria-label="메인 메뉴">
          {links.map(([url, label]) => (
            <Link
              key={url}
              className={pathname.startsWith(url) ? "active" : ""}
              href={url}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button
          className="menu-button"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
