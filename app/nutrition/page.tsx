"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import { getMealChecks, getProfile, setMealCheck, type Profile } from "@/lib/data/store";
import { getCurrentProgramDay, getProgramDay, meals } from "@/lib/data/program";
import { dayDate, localDateString } from "@/lib/date";

const labels = { breakfast: "Завтрак", lunch: "Обед", snack: "Перекус", dinner: "Ужин" } as const;
export default function NutritionPage() {
  const [profile,setProfile] = useState<Profile|null>(null); const [day,setDay] = useState(1); const [checks,setChecks] = useState<Record<string,boolean>>({});
  useEffect(()=>{getProfile().then((p)=>{setProfile(p);setDay(getCurrentProgramDay(p.start_date));});},[]);
  const programDay = getProgramDay(day); const meal = meals[programDay.menu-1];
  const date = useMemo(()=> profile?.start_date ? dayDate(profile.start_date,day) : new Date(),[profile?.start_date,day]);
  const dateKey = profile?.start_date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}` : localDateString(date);
  useEffect(()=>{getMealChecks(dateKey).then(setChecks);},[dateKey]);
  async function toggle(key:string){const next=!checks[key];setChecks(x=>({...x,[key]:next}));await setMealCheck(dateKey,key,next)}
  return <AppShell><main className="page"><div className="container">
    <div className="hero-row"><div><div className="eyebrow">Питание · 1650–1750 ккал</div><h1>Меню дня</h1><p className="lead">Цель — около 120 г белка без жёстких запретов. Крупы указаны преимущественно в сухом виде.</p></div><div className="hero-actions"><button className="btn secondary" disabled={day<=1} onClick={()=>setDay(d=>Math.max(1,d-1))}><ChevronLeft size={17}/></button><span className="badge green">День {day} · Меню {meal.number}</span><button className="btn secondary" disabled={day>=30} onClick={()=>setDay(d=>Math.min(30,d+1))}><ChevronRight size={17}/></button></div></div>
    <div className="grid grid-2"><div className="card"><div className="metric-label">Цель дня</div><div className="metric-value">{meal.calories} <span style={{fontSize:13,color:"var(--muted)"}}>ккал</span></div><div className="metric-sub">Белок ≈ {meal.protein} г · вода ≈ {profile?.water_target_l ?? 2.2} л</div></div><div className="card"><div className="metric-label">Дата</div><div className="metric-value" style={{fontSize:22}}>{date.toLocaleDateString("ru-RU",{day:"numeric",month:"long"})}</div><div className="metric-sub">Можно менять равноценные источники белка и гарниры.</div></div></div>
    <section className="section card">
      {(["breakfast","lunch","snack","dinner"] as const).map((key)=>{const desc=meal[key];return <div className="meal-row" key={key}><button className={`check ${checks[key]?"done":""}`} onClick={()=>toggle(key)}>{checks[key]&&<Check size={17}/>}</button><div><div className="meal-name">{labels[key]}</div><div className="meal-desc">{desc}</div></div><div className="meal-kcal">{checks[key]?"выполнено":"по плану"}</div></div>})}
    </section>
    <section className="section"><h2>Быстрые замены</h2><div className="grid grid-3"><div className="card"><h3>Белок</h3><p className="meal-desc">Курица ↔ индейка ↔ нежирная говядина ↔ белая рыба ↔ креветки.</p></div><div className="card"><h3>Гарнир</h3><p className="meal-desc">Рис ↔ гречка ↔ булгур ↔ картофель ↔ паста при близкой калорийности.</p></div><div className="card"><h3>Гибкость</h3><p className="meal-desc">Около 100–150 ккал можно оставить на любимый продукт внутри суточной цели.</p></div></div></section>
  </div></main></AppShell>
}
