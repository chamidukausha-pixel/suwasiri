import React, { useEffect, useState } from "react";

function parts(now: Date) {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();
  return {
    hourAngle: 30 * (h % 12) + m * 0.5,
    minuteAngle: 6 * m + s * 0.1,
    secondAngle: 6 * s + ms * 0.006,
    digital: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).replace(/\s/g, ""),
    date: now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

export default function PortalClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 50);
    return () => window.clearInterval(id);
  }, []);

  const t = parts(now);
  const size = compact ? 132 : 168;

  return (
    <div className="rounded-[28px] bg-[#070B14] text-white shadow-2xl shadow-sky-950/40 border border-white/5 px-4 pt-4 pb-3 flex flex-col items-center">
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle at 50% 45%, #141A28 0%, #070B14 72%)",
          boxShadow: "0 0 0 2px #0b1220, 0 0 18px rgba(99,102,241,0.35)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            padding: 3,
            background: "conic-gradient(from 200deg, #38bdf8, #6366f1, #a855f7, #38bdf8)",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30;
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 text-[9px] font-semibold text-white/80"
              style={{
                transform: `rotate(${angle}deg) translateY(-${size / 2 - 16}px) rotate(-${angle}deg) translate(-50%, -50%)`,
              }}
            >
              {i === 0 ? 12 : i}
            </span>
          );
        })}
        {Array.from({ length: 60 }).map((_, i) =>
          i % 5 === 0 ? null : (
            <span
              key={`t${i}`}
              className="absolute left-1/2 top-[10px] w-px h-1 bg-white/25"
              style={{ transform: `rotate(${i * 6}deg)`, transformOrigin: `50% ${size / 2 - 10}px` }}
            />
          )
        )}
        <span
          className="absolute left-1/2 top-1/2 origin-bottom bg-sky-200 rounded-full"
          style={{
            width: 4,
            height: size * 0.26,
            transform: `translate(-50%, -100%) rotate(${t.hourAngle}deg)`,
            transformOrigin: "50% 100%",
          }}
        />
        <span
          className="absolute left-1/2 top-1/2 origin-bottom bg-sky-300 rounded-full"
          style={{
            width: 3,
            height: size * 0.34,
            transform: `translate(-50%, -100%) rotate(${t.minuteAngle}deg)`,
            transformOrigin: "50% 100%",
          }}
        />
        <span
          className="absolute left-1/2 top-1/2 origin-bottom bg-rose-400"
          style={{
            width: 1.5,
            height: size * 0.38,
            transform: `translate(-50%, -100%) rotate(${t.secondAngle}deg)`,
            transformOrigin: "50% 100%",
          }}
        />
        <span className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
      </div>
      <p className="mt-3 text-[18px] font-black tracking-[0.08em] tabular-nums leading-none">
        {t.digital.replace("AM", " AM").replace("PM", " PM")}
      </p>
      <p className="mt-1.5 text-[10px] text-slate-400 font-semibold tracking-wide">{t.date}</p>
    </div>
  );
}
