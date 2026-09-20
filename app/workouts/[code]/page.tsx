"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Clock3, Play, RotateCcw, Save } from "lucide-react";
import AppShell from "@/components/AppShell";
import { finishWorkoutSession, getProfile, saveWorkoutSet, startWorkoutSession, type Profile } from "@/lib/data/store";
import { getCurrentProgramDay, workouts, type WorkoutTemplate } from "@/lib/data/program";

type SetEntry = { weight: string; reps: string; done: boolean };

export default function WorkoutPage(){
  const params=useParams<{code:string}>(); const code=(params.code??"A").toUpperCase() as WorkoutTemplate["code"];
  const workout=workouts[code]??workouts.A;
  const [profile,setProfile]=useState<Profile|null>(null); const [sessionId,setSessionId]=useState<string|null>(null); const [startedAt,setStartedAt]=useState<number|null>(null); const [entries,setEntries]=useState<Record<string,SetEntry>>({}); const [rest,setRest]=useState(0); const [finished,setFinished]=useState(false); const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  useEffect(()=>{getProfile().then(setProfile);return()=>{if(timerRef.current)clearInterval(timerRef.current)}},[]);
  const day=useMemo(()=>getCurrentProgramDay(profile?.start_date),[profile?.start_date]);
  async function start(){if(sessionId)return sessionId;const id=await startWorkoutSession(day,workout.code);setSessionId(id);setStartedAt(Date.now());return id}
  function setKey(exercise:string,setNo:number){return `${exercise}:${setNo}`}
  function countSets(sets:number|string){if(typeof sets==="number")return sets;if(workout.code==="D"){const week=Math.ceil(day/7);return week===1?3:4}return 1}
  async function toggle(exerciseKey:string,setNo:number){const activeSession=await start();const k=setKey(exerciseKey,setNo);const current=entries[k]??{weight:"",reps:"",done:false};const next={...current,done:!current.done};setEntries(x=>({...x,[k]:next}));if(next.done){await saveWorkoutSet(activeSession,exerciseKey,setNo,next.weight?Number(next.weight):null,next.reps?Number(next.reps):null,true);beginRest(60)}}
  function patch(k:string,patch:Partial<SetEntry>){setEntries(x=>({...x,[k]:{weight:"",reps:"",done:false,...x[k],...patch}}))}
  function beginRest(seconds:number){if(timerRef.current)clearInterval(timerRef.current);setRest(seconds);timerRef.current=setInterval(()=>setRest(v=>{if(v<=1){if(timerRef.current)clearInterval(timerRef.current);return 0}return v-1}),1000)}
  async function finish(){if(!sessionId){await start();return}const duration=Math.max(1,Math.round((Date.now()-(startedAt??Date.now()))/60000));await finishWorkoutSession(sessionId,day,duration);setFinished(true);if(timerRef.current)clearInterval(timerRef.current)}
  const totalSets=workout.exercises.reduce((n,e)=>n+countSets(e.sets),0); const doneSets=Object.values(entries).filter(x=>x.done).length;
  return <AppShell><main className="page"><div className="container">
    <div className="hero-row"><div><div className="eyebrow">{workout.subtitle}</div><h1>{workout.title}</h1><p className="lead">{workout.duration} · День {day}. Оставляй примерно 2–3 повтора в запасе и не жертвуй техникой ради веса.</p></div><div className="hero-actions">{!sessionId?<button className="btn" onClick={start}><Play size={17}/>Начать</button>:<button className="btn" onClick={finish}><Save size={17}/>Завершить</button>}</div></div>
    {finished&&<div className="notice" style={{marginBottom:16,borderColor:"rgba(183,243,75,.3)",background:"rgba(183,243,75,.08)",color:"#dfffaa"}}>Тренировка сохранена и день отмечен выполненным.</div>}
    <div className="grid grid-3" style={{marginBottom:20}}><div className="card"><div className="metric-label">Прогресс</div><div className="metric-value">{doneSets}/{totalSets}</div><div className="progress"><span style={{width:`${totalSets?doneSets/totalSets*100:0}%`}}/></div></div><div className="card"><div className="metric-label">Отдых</div><div className="metric-value">{Math.floor(rest/60)}:{String(rest%60).padStart(2,"0")}</div><button className="btn ghost" style={{marginTop:10,padding:"8px 10px"}} onClick={()=>beginRest(60)}><RotateCcw size={14}/> 1:00</button></div><div className="card"><div className="metric-label">Статус</div><div className="metric-value" style={{fontSize:22}}>{sessionId?"Идёт тренировка":"Готова к старту"}</div><div className="metric-sub"><Clock3 size={12} style={{verticalAlign:"-2px"}}/> {workout.duration}</div></div></div>
    <section className="card">
      {workout.exercises.length===0?<div><h2>День отдыха</h2><p className="lead">Спокойная активность по самочувствию. Сон и восстановление сегодня важнее интенсивности.</p><Link href="/today" className="btn">Вернуться на сегодня</Link></div>:workout.exercises.map((exercise,index)=><div className="exercise" key={exercise.key} style={{display:"block"}}>
        <div style={{display:"grid",gridTemplateColumns:"48px 1fr auto",gap:14,alignItems:"center"}}><div className="exercise-index">{index+1}</div><div className="exercise-main"><h3>{exercise.name}</h3><p>{exercise.sets} подхода · {exercise.reps} · отдых {exercise.rest}{exercise.note?` · ${exercise.note}`:""}</p></div><div className="exercise-side">{countSets(exercise.sets)} сет.</div></div>
        <div style={{marginLeft:62,marginTop:12,display:"grid",gap:8}}>{Array.from({length:countSets(exercise.sets)},(_,i)=>{const k=setKey(exercise.key,i+1);const e=entries[k]??{weight:"",reps:"",done:false};return <div key={k} style={{display:"grid",gridTemplateColumns:"42px 1fr 1fr 42px",gap:8,alignItems:"center"}}><span className="badge" style={{justifyContent:"center"}}>{i+1}</span><input className="input" inputMode="decimal" placeholder="кг" value={e.weight} onChange={ev=>patch(k,{weight:ev.target.value})}/><input className="input" inputMode="numeric" placeholder="повторы" value={e.reps} onChange={ev=>patch(k,{reps:ev.target.value})}/><button className={`check ${e.done?"done":""}`} onClick={()=>toggle(exercise.key,i+1)}>{e.done&&<Check size={16}/>}</button></div>})}</div>
      </div>)}
    </section>
  </div></main></AppShell>
}
