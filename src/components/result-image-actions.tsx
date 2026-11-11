"use client";
import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import type { Reading } from "@/lib/types";
async function resultPng(reading: Reading) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1600;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("이 브라우저에서 이미지 저장을 지원하지 않습니다.");
  const c = context;
  c.fillStyle = "#fffcfa";
  c.fillRect(0, 0, 1200, 1600);
  const img = new Image();
  img.src = reading.analysis?.image.src || "/dragon.webp";
  await img.decode();
  const ratio = Math.min(760 / img.width, 760 / img.height);
  c.drawImage(
    img,
    (1200 - img.width * ratio) / 2,
    90,
    img.width * ratio,
    img.height * ratio,
  );
  c.textAlign = "center";
  c.fillStyle = "#867390";
  c.font = '24px "Malgun Gothic", sans-serif';
  c.fillText("나읽기 · YOUR UNIQUE STORY", 600, 70);
  function wrap(
    text: string,
    y: number,
    size: number,
    color: string,
    width: number,
    maxLines: number,
  ) {
    c.font = `${size >= 52 ? "600 " : ""}${size}px "Malgun Gothic", sans-serif`;
    c.fillStyle = color;
    let line = "",
      row = 0;
    const characters = [...text];
    for (let index = 0; index < characters.length; index++) {
      const ch = characters[index];
      if (c.measureText(line + ch).width > width) {
        if (row === maxLines - 1) {
          c.fillText(line.slice(0, -1) + "…", 600, y + row * size * 1.55);
          return;
        }
        c.fillText(line, 600, y + row * size * 1.55);
        row++;
        line = ch;
      } else line += ch;
    }
    if (line) c.fillText(line, 600, y + row * size * 1.55);
  }
  wrap(reading.title, 930, 64, "#28222d", 1040, 3);
  wrap(reading.subtitle, 1140, 30, "#766b80", 980, 3);
  wrap(
    reading.keywords.map((k) => `#${k}`).join("  "),
    1340,
    28,
    "#947da4",
    1020,
    2,
  );
  c.font = '21px "Malgun Gothic", sans-serif';
  c.fillStyle = "#a69ba9";
  c.fillText(
    "자기 탐색을 위한 문화·성격 콘텐츠 · 미래를 예측하지 않아요",
    600,
    1525,
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("이미지를 만들지 못했어요.")),
      "image/png",
    ),
  );
  return blob;
}
export default function ResultImageActions({ reading }: { reading: Reading }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save(share: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const blob = await resultPng(reading),
        file = new File([blob], "nailgi-profile.png", { type: "image/png" });
      if (share && navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: reading.title });
      else {
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage(
          share
            ? "공유 기능 대신 PNG 파일을 저장했어요."
            : "프로필 이미지를 저장했어요.",
        );
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setMessage(
          e instanceof Error ? e.message : "이미지를 저장하지 못했어요.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="result-image-actions">
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => save(false)}
        >
          <Download size={16} />
          {busy ? "이미지 준비 중" : "프로필 PNG 저장"}
        </button>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => save(true)}
        >
          <Share2 size={16} />
          이미지 공유
        </button>
      </div>
      {message && (
        <p className="small muted center" role="status">
          {message}
        </p>
      )}
    </>
  );
}
