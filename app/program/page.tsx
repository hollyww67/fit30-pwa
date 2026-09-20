"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Footprints } from "lucide-react";
import AppShell from "@/components/AppShell";
import { getCompletedDays, getProfile, markProgramDay, type Profile } from "@/lib/data/store";
import { getCurrentProgramDay, programDays, workouts } from "@/lib/data/program";
import { dayDate } from "@/lib/date";

export default function ProgramPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => { Promise.all([getProfile(), getCompletedDays()]).then(([p,d]) => { setProfile(p); setDone(d); }); }, []);
  const current = useMemo(() => getCurrentProgramDay(profile?.start_date), [profile?.start_date]);
  async function toggle(day: number) {
    const next = !done.includes(day); setDone((x) => next ? [...x, day] : x.filter((d) => d !== day)); await markProgramDay(day, next);
  }
  return <AppShell><main className="page"><div className="container">
    <div className="hero-row"><div><div className="eyebrow">30 дней</div><h1>Программа</h1><p className="lead">Четыре силовых дня, LISS, mobility и восстановление с постепенным ростом нагрузки.</p></div><span className="badge green">{done.length} / 30 выполнено</span></div>
    {[1,2,3,4,5].map((week) => {
      const days = programDays.filter((d) => d.week === week);
      if (!days.length) return null;
      return <section className="section" key={week}><h2>Неделя {week}</h2><div className="calendar">
        {days.map((d) => { const w = workouts[d.workoutCode]; const completed = done.includes(d.day); const date = profile?.start_date ? dayDate(profile.start_date, d.day) : null; return <div className={`day-card ${d.day === current ? "current" : ""} ${completed ? "done" : ""}`} key={d.day}>
          <div><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span className="day-num">День {d.day}{date ? ` · ${date.toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit"})}` : ""}</span><button className={`check ${completed ? "done" : ""}`} onClick={() => toggle(d.day)} aria-label="Отметить день">{completed && <Check size={15}/>}</button></div><Link href={`/workouts/${d.workoutCode}`}><div className="day-title" style={{marginTop:12}}>{w.title}</div></Link><div className="metric-sub">Меню {d.menu}</div></div>
          <div className="day-steps"><Footprints size={12} style={{verticalAlign:"-2px"}}/> {d.steps.toLocaleString("ru-RU")} шагов</div>
        </div>})}
      </div></section>;
    })}
  </div></main></AppShell>;
}
