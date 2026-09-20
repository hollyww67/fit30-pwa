"use client";

import { useEffect, useMemo, useState } from "react";
import { Ruler, Save, Scale, TrendingDown } from "lucide-react";
import AppShell from "@/components/AppShell";
import WeightChart from "@/components/WeightChart";
import { getCheckins, getMeasurements, getProfile, saveCheckin, saveMeasurement, type DailyCheckin, type Measurement, type Profile } from "@/lib/data/store";
import { localDateString } from "@/lib/date";

export default function ProgressPage(){
  const date=localDateString(); const [profile,setProfile]=useState<Profile|null>(null); const [checkins,setCheckins]=useState<DailyCheckin[]>([]); const [measurements,setMeasurements]=useState<Measurement[]>([]); const [weight,setWeight]=useState(""); const [m,setM]=useState<Measurement>({date}); const [saved,setSaved]=useState(false);
  async function refresh(){const [p,c,ms]=await Promise.all([getProfile(),getCheckins(),getMeasurements()]);setProfile(p);setCheckins(c);setMeasurements(ms)}
  useEffect(()=>{refresh()},[]);
  const lastWeight=useMemo(()=>[...checkins].reverse().find(x=>typeof x.weight_kg==="number")?.weight_kg,[checkins]);
  const change=lastWeight!=null?(Number(profile?.start_weight_kg??85)-Number(lastWeight)):0;
  const pct=Math.max(0,Math.min(100,(change/(Number(profile?.start_weight_kg??85)-Number(profile?.target_weight_kg??62.5)))*100));
  async function save(){setSaved(false);if(weight){const existing=checkins.find(x=>x.date===date)??{date,workout_status:"not_started" as const};await saveCheckin({...existing,weight_kg:Number(weight)})}await saveMeasurement(m);await refresh();setSaved(true);setTimeout(()=>setSaved(false),1800)}
  return <AppShell><main className="page"><div className="container">
    <div className="hero-row"><div><div className="eyebrow">Прогресс</div><h1>Результаты</h1><p className="lead">Смотри на среднюю тенденцию, а не на одну цифру. Вес может колебаться из-за воды, соли и цикла.</p></div><div className="hero-actions"><button className="btn" onClick={save}><Save size={17}/>{saved?"Сохранено":"Сохранить замеры"}</button></div></div>
    <div className="grid grid-4"><div className="card"><div className="metric-label">Старт</div><div className="metric-value">{profile?.start_weight_kg??85} кг</div></div><div className="card"><div className="metric-label">Сейчас</div><div className="metric-value">{lastWeight??"—"}{lastWeight!=null?" кг":""}</div></div><div className="card"><div className="metric-label">Сброшено</div><div className="metric-value">{change.toFixed(1)} кг</div><div className="progress"><span style={{width:`${pct}%`}}/></div></div><div className="card"><div className="metric-label">Цель</div><div className="metric-value">{profile?.target_weight_kg??62.5} кг</div></div></div>
    <section className="section grid grid-2"><div className="card"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div className="eyebrow">Вес</div><h2 style={{marginTop:7}}>Последние записи</h2></div><TrendingDown color="var(--accent)"/></div><WeightChart data={checkins}/></div>
    <div className="card"><div className="eyebrow">Сегодня</div><h2 style={{marginTop:7}}>Новые замеры</h2><div className="form-grid"><label className="field"><span><Scale size={13}/> Вес, кг</span><input className="input" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)} placeholder={lastWeight?String(lastWeight):"85"}/></label>{([['waist_cm','Талия'],['abdomen_cm','Живот'],['hips_cm','Бёдра'],['chest_cm','Грудь'],['thigh_cm','Бедро'],['arm_cm','Рука']] as const).map(([key,label])=><label className="field" key={key}><span><Ruler size={13}/> {label}, см</span><input className="input" inputMode="decimal" value={m[key]??""} onChange={e=>setM({...m,[key]:e.target.value?Number(e.target.value):null})}/></label>)}</div></div></section>
    <section className="section"><h2>История замеров</h2><div className="card">{measurements.length===0?<p className="meal-desc" style={{margin:0}}>Пока нет замеров. Добавь первый набор выше.</p>:measurements.slice().reverse().slice(0,8).map(row=><div className="meal-row" key={row.date}><div className="exercise-index"><Ruler size={17}/></div><div><div className="meal-name">{new Date(`${row.date}T12:00:00`).toLocaleDateString("ru-RU")}</div><div className="meal-desc">Талия {row.waist_cm??"—"} · Живот {row.abdomen_cm??"—"} · Бёдра {row.hips_cm??"—"} · Грудь {row.chest_cm??"—"}</div></div></div>)}</div></section>
  </div></main></AppShell>
}
