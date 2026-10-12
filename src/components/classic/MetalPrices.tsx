"use client";
/**
 * Gold & silver price box in the classic goldprice.org chart style:
 *   "Gold   USD4183.81 ▼ 11.13"
 *   [intraday line chart, hours 0–24 NY time, grid, y-axis labels]
 *   "Oct 12, 2026 at 02:37 NY Time"
 *
 * Prices are simulated around BASE prices (same approach as MetalPriceTicker):
 * a seeded intraday history from midnight NY time up to now, then a new tick
 * every few seconds. To show real market prices, replace useLiveMetal() with
 * a fetch to a price API.
 */
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// ─── Config ───────────────────────────────────────────────────────────────────
const METALS = [
  { key: "gold", label: "Gold", base: 4183.81, decimals: 0 },
  { key: "silver", label: "Silver Price", base: 60.84, decimals: 2 },
] as const;

const TICK_MS = 4000; // how often a new live price arrives
const STEP_MIN = 10; // minutes between seeded history points
const VOLATILITY = 0.0012; // per-step random move (fraction of price)

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface Point {
  h: number; // hour of the NY day, 0–24 (fractional)
  v: number;
}

/** Current NY time as { hour (fractional), label }. */
function nyNow() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);
  return { hour: hh + mm / 60, label: `${date} at ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} NY Time` };
}

function step(prev: number, base: number) {
  // Random walk with a gentle pull back toward the base price.
  const pull = (base - prev) * 0.02;
  return +(prev + pull + (Math.random() - 0.5) * base * VOLATILITY).toFixed(3);
}

function useLiveMetal(base: number) {
  const [series, setSeries] = useState<Point[]>([]);
  const [open, setOpen] = useState(base);
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    // Client-only (avoids hydration mismatch): seed today's history.
    const { hour, label } = nyNow();
    const start = +(base * (1 + (Math.random() - 0.5) * 0.004)).toFixed(3);
    const pts: Point[] = [{ h: 0, v: start }];
    for (let m = STEP_MIN; m / 60 < hour; m += STEP_MIN) {
      pts.push({ h: m / 60, v: step(pts[pts.length - 1].v, base) });
    }
    if (pts.length < 2) pts.push({ h: Math.max(hour, 0.05), v: step(start, base) });
    setOpen(start);
    setSeries(pts);
    setStamp(label);

    const id = setInterval(() => {
      const now = nyNow();
      setStamp(now.label);
      setSeries((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        // New NY day: start a fresh chart.
        if (now.hour < last.h - 1) {
          setOpen(last.v);
          return [{ h: 0, v: last.v }, { h: now.hour, v: step(last.v, base) }];
        }
        return [...prev, { h: Math.max(now.hour, last.h + 0.001), v: step(last.v, base) }];
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [base]);

  const current = series.length ? series[series.length - 1].v : base;
  return { series, current, change: current - open, stamp };
}

// ─── One chart ────────────────────────────────────────────────────────────────
function MetalChart({ label, base, decimals }: { label: string; base: number; decimals: number }) {
  const { series, current, change, stamp } = useLiveMetal(base);
  const down = change < 0;

  const [min, max] = useMemo(() => {
    if (!series.length) return [base * 0.998, base * 1.002];
    const vals = series.map((p) => p.v);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = Math.max((hi - lo) * 0.08, base * 0.0004);
    return [lo - pad, hi + pad];
  }, [series, base]);

  const yTicks = useMemo(() => {
    const n = 4;
    return Array.from({ length: n }, (_, i) => +(min + ((max - min) * i) / (n - 1)).toFixed(decimals));
  }, [min, max, decimals]);

  return (
    <figure className="mp-chart" aria-label={`${label} price today`}>
      <figcaption className="mp-head">
        <span className="mp-name">{label}</span>
        <span className="mp-price">
          USD{current.toFixed(2)}{" "}
          <span className={down ? "mp-down" : "mp-up"}>
            {down ? "▼" : "▲"} {Math.abs(change).toFixed(2)}
          </span>
        </span>
      </figcaption>

      <div className="mp-plot">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#d9d9d9" strokeWidth={1} />
            <XAxis
              dataKey="h"
              type="number"
              domain={[0, 24]}
              ticks={[2, 6, 10, 14, 18, 22]}
              tick={{ fontSize: 9, fill: "#000" }}
              tickLine={false}
              axisLine={{ stroke: "#999" }}
              height={14}
            />
            <YAxis
              domain={[min, max]}
              ticks={yTicks}
              tick={{ fontSize: 9, fill: "#000" }}
              tickFormatter={(v: number) => v.toFixed(decimals)}
              tickLine={false}
              axisLine={{ stroke: "#999" }}
              width={decimals ? 34 : 30}
            />
            <Line
              type="linear"
              dataKey="v"
              stroke="#ff0000"
              strokeWidth={1.4}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mp-stamp" suppressHydrationWarning>
        {stamp || "\u00a0"}
      </div>
    </figure>
  );
}

// ─── Box ──────────────────────────────────────────────────────────────────────
export default function MetalPrices() {
  return (
    <div className="sbc-section sbc-metal">
      <style>{`
        .sbc-metal-text { font-size: 11px; line-height: 16px; color: #000; margin: 2px 0 2px; }
        .mp-charts {
          display: grid; grid-template-columns: repeat(2, minmax(0, 210px));
          justify-content: center; gap: 4px 40px; padding: 2px 0 12px;
        }
        .mp-chart { margin: 0; background: #fff; font-family: Verdana, Geneva, sans-serif; }
        .mp-head { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; padding: 0 4px; }
        .mp-name { color: #ff3c3c; font-size: 11px; }
        .mp-price { color: #000; font-size: 10px; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .mp-down { color: #ff0000; }
        .mp-up { color: #008000; }
        .mp-plot { height: 120px; }
        .mp-stamp { text-align: center; font-size: 9px; color: #000; padding-top: 1px; }
        @media (max-width: 520px) {
          .mp-charts { grid-template-columns: minmax(0, 1fr); }
          .mp-name { font-size: 13px; } .mp-price { font-size: 12px; }
        }
      `}</style>

      <p className="sbc-metal-text">
        While gold and Silver price is rising alpha keeps it low. Check what is today&apos;s gold and silver price
        and compare it to our products. In many cases you will see that our gold and silver jewelry is really
        affordable and many items are way below actual gold or silver price.
      </p>
      <div className="mp-charts">
        {METALS.map((m) => (
          <MetalChart key={m.key} label={m.label} base={m.base} decimals={m.decimals} />
        ))}
      </div>
    </div>
  );
}