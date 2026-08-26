"use client";
import * as React from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { compactUsd, num } from "@/lib/format";

/* Chart palette — sequential evergreen + warm neutrals. Never more than 5 series. */
export const SERIES = ["#3a5740", "#8d9c84", "#b9a597", "#6e8f72", "#a6aeba"];

const axis = { stroke: "#9ba0a7", fontSize: 11, tickLine: false, axisLine: false } as const;

function ChartTip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-line bg-surface px-2.5 py-2 shadow-pop">
      <p className="mb-1 text-[11.5px] font-medium text-ink">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-[12px] text-ink-2">
          <span className="size-2 rounded-[2px]" style={{ background: p.color }} />
          <span className="text-ink-3">{p.name}</span>
          <span className="ml-auto tabular font-medium text-ink">{fmt ? fmt(p.value) : num(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function AreaTrend({ data, xKey, yKey, name, height = 220, money = true }: {
  data: any[]; xKey: string; yKey: string; name: string; height?: number; money?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e8e5df" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} tickFormatter={(v) => (money ? compactUsd(v) : num(v))} width={58} />
        <Tooltip content={<ChartTip fmt={money ? compactUsd : num} />} cursor={{ stroke: "#d9d5cd" }} />
        <Area type="monotone" dataKey={yKey} name={name} stroke={SERIES[0]} strokeWidth={2} fill={`url(#g-${yKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({ data, xKey, yKey, name, height = 220, money = false, horizontal = false }: {
  data: any[]; xKey: string; yKey: string; name: string; height?: number; money?: boolean; horizontal?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 6, right: 10, left: horizontal ? 8 : -14, bottom: 0 }}>
        <CartesianGrid stroke="#e8e5df" strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axis} tickFormatter={(v) => (money ? compactUsd(v) : num(v))} />
            <YAxis type="category" dataKey={xKey} {...axis} width={128} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axis} />
            <YAxis {...axis} tickFormatter={(v) => (money ? compactUsd(v) : num(v))} width={54} />
          </>
        )}
        <Tooltip content={<ChartTip fmt={money ? compactUsd : num} />} cursor={{ fill: "#f6f5f2" }} />
        <Bar dataKey={yKey} name={name} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={horizontal ? 18 : 34}>
          {data.map((_, i) => <Cell key={i} fill={SERIES[i % 2 === 0 ? 0 : 1]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineCompare({ data, xKey, series, height = 240, money = false, dualAxis = false }: {
  data: any[]; xKey: string; series: { key: string; name: string }[];
  height?: number; money?: boolean; dualAxis?: boolean;
}) {
  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-4">
        {series.map((s, i) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-ink-3">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ background: SERIES[i], opacity: dualAxis && i > 0 ? 0.75 : 1 }}
            />
            {s.name}
          </span>
        ))}
      </div>
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: dualAxis ? 4 : 6, left: -6, bottom: 0 }}>
        <CartesianGrid stroke="#e8e5df" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis
          yAxisId="left"
          {...axis}
          tickFormatter={(v) => (money ? compactUsd(v) : num(v))}
          width={62}
        />
        {dualAxis && (
          <YAxis yAxisId="right" orientation="right" {...axis} tickFormatter={(v) => num(v)} width={40} />
        )}
        <Tooltip
          content={<ChartTip fmt={(v: number) => (money ? compactUsd(v) : num(v))} />}
          cursor={{ stroke: "#d9d5cd" }}
        />
        {series.map((s, i) => (
          <Line
            key={s.key}
            yAxisId={dualAxis && i > 0 ? "right" : "left"}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={SERIES[i]}
            strokeWidth={2}
            strokeDasharray={dualAxis && i > 0 ? "4 3" : undefined}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
    </>
  );
}

export function Funnel({ data }: { data: { stage: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.stage} className="flex items-center gap-3">
          <span className="w-[92px] shrink-0 text-[12.5px] text-ink-3">{d.stage}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-[6px] bg-subtle">
            <div
              className="flex h-full items-center justify-end rounded-[6px] px-2 text-[11.5px] font-medium text-white transition-[width] duration-700"
              style={{ width: `${(d.count / max) * 100}%`, background: SERIES[0], opacity: 1 - i * 0.11 }}
            >
              {d.count}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
