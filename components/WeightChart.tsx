"use client";

import type { DailyCheckin } from "@/lib/data/store";

export default function WeightChart({ data }: { data: DailyCheckin[] }) {
  const points = data.filter((x) => typeof x.weight_kg === "number").slice(-30);
  if (points.length < 2) return <div className="chart-empty">Добавь минимум 2 значения веса — здесь появится график.</div>;
  const values = points.map((x) => Number(x.weight_kg));
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const width = 760; const height = 210; const padX = 22; const padY = 24;
  const x = (i:number) => padX + (i/(points.length-1))*(width-padX*2);
  const y = (v:number) => height-padY-((v-min)/(max-min||1))*(height-padY*2);
  const path = values.map((v,i)=>`${i===0?"M":"L"} ${x(i)} ${y(v)}`).join(" ");
  return <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="График динамики веса">
    {[0,1,2,3].map((n)=>{const yy=padY+n*((height-padY*2)/3);return <line key={n} x1={padX} x2={width-padX} y1={yy} y2={yy} stroke="rgba(255,255,255,.07)"/>})}
    <path d={path} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {values.map((v,i)=><g key={i}><circle cx={x(i)} cy={y(v)} r="4" fill="var(--accent)"/><text x={x(i)} y={y(v)-10} textAnchor="middle" className="chart-label">{v}</text></g>)}
  </svg>;
}
