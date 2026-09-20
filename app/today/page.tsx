"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Droplets, Flame, Footprints, Moon, Scale, UtensilsCrossed } from "lucide-react";
import AppShell from "@/components/AppShell";
import { getCheckin, getMealChecks, getProfile, saveCheckin, setMealCheck, type DailyCheckin, type Profile } from "@/lib/data/store";
import { getCurrentProgramDay, getProgramDay, meals, workouts } from "@/lib/data/program";
import { formatRuDate, localDateString } from "@/lib/date";

const mealLabels: Record<string, string> = { breakfast: "Завтрак", lunch: "Обед", snack: "Перекус", dinner: "Ужин" };

export default function TodayPage() {
  const date = localDateString();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkin, setCheckin] = useState<DailyCheckin>({ date, workout_status: "not_started" });
  const [mealChecks, setMealChecks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getProfile(), getCheckin(date), getMealChecks(date)]).then(([p, c, m]) => {
      setProfile(p); setCheckin(c); setMealChecks(m);
    });
  }, [date]);

  const programDayNumber = useMemo(() => getCurrentProgramDay(profile?.start_date), [profile?.start_date]);
  const programDay = getProgramDay(programDayNumber);
  const workout = workouts[programDay.workoutCode];
  const meal = meals[programDay.menu - 1];

  async function patchCheckin(patch: Partial<DailyCheckin>) {
    const next = { ...checkin, ...patch, date };
    setCheckin(next); setSaving(true);
    try { await saveCheckin(next); } finally { setSaving(false); }
  }

  async function toggleMeal(key: string) {
    const next = !mealChecks[key];
    setMealChecks((x) => ({ ...x, [key]: next }));
    await setMealCheck(date, key, next);
  }

  const caloriesTarget = profile?.calories_target ?? 1700;
  const proteinTarget = profile?.protein_target_g ?? 120;
  const waterTarget = profile?.water_target_l ?? 2.2;
  const stepTarget = programDay.steps;

  const stats = [
    { label: "Калории", value: checkin.calories ?? 0, target: caloriesTarget, unit: "ккал", icon: Flame },
    { label: "Белок", value: checkin.protein_g ?? 0, target: proteinTarget, unit: "г", icon: UtensilsCrossed },
    { label: "Шаги", value: checkin.steps ?? 0, target: stepTarget, unit: "", icon: Footprints },
    { label: "Вода", value: checkin.water_l ?? 0, target: waterTarget, unit: "л", icon: Droplets },
  ];

  return (
    <AppShell>
      <main className="page">
        <div className="container">
          <div className="hero-row">
            <div>
              <div className="eyebrow">День {programDayNumber} из 30</div>
              <h1>{profile?.display_name ? `Привет, ${profile.display_name}` : "Сегодня"}</h1>
              <p className="lead" style={{ textTransform: "capitalize" }}>{formatRuDate()} · {saving ? "сохраняем…" : "всё синхронизировано"}</p>
            </div>
            <div className="hero-actions">
              <Link className="btn secondary" href="/settings">Настройки</Link>
              <Link className="btn" href={`/workouts/${programDay.workoutCode}`}>Начать тренировку</Link>
            </div>
          </div>

          <div className="grid grid-4">
            {stats.map(({ label, value, target, unit, icon: Icon }) => {
              const pct = Math.min(100, Math.round((Number(value) / Number(target || 1)) * 100));
              return <div className="card" key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="metric-label">{label}</div><Icon size={18} color="var(--accent)" />
                </div>
                <div className="metric-value">{Number(value).toLocaleString("ru-RU")} <span style={{ fontSize: 13, color: "var(--muted)" }}>{unit}</span></div>
                <div className="metric-sub">цель {Number(target).toLocaleString("ru-RU")} {unit}</div>
                <div className="progress"><span style={{ width: `${pct}%` }} /></div>
              </div>;
            })}
          </div>

          <section className="section split">
            <div className="grid">
              <div className="card workout-card">
                <div>
                  <span className="badge green">Сегодня</span>
                  <h2 style={{ marginTop: 14 }}>{workout.title}</h2>
                  <div className="workout-meta"><span>{workout.subtitle}</span><span>{workout.duration}</span><span>{workout.exercises.length} упражнений</span></div>
                  {programDay.activity && <p className="metric-sub" style={{ marginTop: 12 }}>{programDay.activity}</p>}
                </div>
                <Link className="btn" href={`/workouts/${programDay.workoutCode}`}>Открыть <ChevronRight size={17} /></Link>
              </div>

              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div><div className="eyebrow">Питание</div><h2 style={{ marginTop: 7 }}>Меню {meal.number}</h2></div>
                  <span className="badge">≈ {meal.calories} ккал · {meal.protein} г белка</span>
                </div>
                {(["breakfast", "lunch", "snack", "dinner"] as const).map((key) => {
                  const desc = key === "breakfast" ? meal.breakfast : key === "lunch" ? meal.lunch : key === "snack" ? meal.snack : meal.dinner;
                  return <div className="meal-row" key={key}>
                    <button className={`check ${mealChecks[key] ? "done" : ""}`} onClick={() => toggleMeal(key)} aria-label={`Отметить ${mealLabels[key]}`}>
                      {mealChecks[key] && <Check size={17} strokeWidth={3} />}
                    </button>
                    <div><div className="meal-name">{mealLabels[key]}</div><div className="meal-desc">{desc}</div></div>
                    <div className="meal-kcal">{mealChecks[key] ? "готово" : "по плану"}</div>
                  </div>;
                })}
              </div>
            </div>

            <aside className="card sticky">
              <div className="eyebrow">Быстрый чек-ин</div>
              <h2 style={{ marginTop: 8 }}>Запиши день</h2>
              <div className="form-grid">
                <label className="field"><span><Scale size={13} /> Вес, кг</span><input className="input" inputMode="decimal" value={checkin.weight_kg ?? ""} onChange={(e) => setCheckin({ ...checkin, weight_kg: e.target.value ? Number(e.target.value) : null })} onBlur={() => patchCheckin({ weight_kg: checkin.weight_kg })} /></label>
                <label className="field"><span><Footprints size={13} /> Шаги</span><input className="input" inputMode="numeric" value={checkin.steps ?? ""} onChange={(e) => setCheckin({ ...checkin, steps: e.target.value ? Number(e.target.value) : null })} onBlur={() => patchCheckin({ steps: checkin.steps })} /></label>
                <label className="field"><span><Droplets size={13} /> Вода, л</span><input className="input" inputMode="decimal" value={checkin.water_l ?? ""} onChange={(e) => setCheckin({ ...checkin, water_l: e.target.value ? Number(e.target.value) : null })} onBlur={() => patchCheckin({ water_l: checkin.water_l })} /></label>
                <label className="field"><span><Moon size={13} /> Сон, ч</span><input className="input" inputMode="decimal" value={checkin.sleep_hours ?? ""} onChange={(e) => setCheckin({ ...checkin, sleep_hours: e.target.value ? Number(e.target.value) : null })} onBlur={() => patchCheckin({ sleep_hours: checkin.sleep_hours })} /></label>
                <label className="field"><span>Калории</span><input className="input" inputMode="numeric" value={checkin.calories ?? ""} onChange={(e) => setCheckin({ ...checkin, calories: e.target.value ? Number(e.target.value) : null })} onBlur={() => patchCheckin({ calories: checkin.calories })} /></label>
                <label className="field"><span>Белок, г</span><input className="input" inputMode="numeric" value={checkin.protein_g ?? ""} onChange={(e) => setCheckin({ ...checkin, protein_g: e.target.value ? Number(e.target.value) : null })} onBlur={() => patchCheckin({ protein_g: checkin.protein_g })} /></label>
              </div>
              <div style={{ marginTop: 14 }}>
                <label className="field"><span>Заметка</span><textarea className="input" placeholder="Самочувствие, голод, энергия…" value={checkin.notes ?? ""} onChange={(e) => setCheckin({ ...checkin, notes: e.target.value })} onBlur={() => patchCheckin({ notes: checkin.notes })} /></label>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
