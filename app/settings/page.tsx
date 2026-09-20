"use client";

import { useEffect, useState } from "react";
import { Save, UserRound } from "lucide-react";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { getProfile, saveProfile, type Profile } from "@/lib/data/store";
import { defaultProfile } from "@/lib/data/program";

const fields = [
  ["display_name", "Имя", "text"],
  ["start_date", "Дата старта", "date"],
  ["height_cm", "Рост, см", "decimal"],
  ["start_weight_kg", "Стартовый вес, кг", "decimal"],
  ["target_weight_kg", "Целевой вес, кг", "decimal"],
  ["calories_target", "Калории", "numeric"],
  ["protein_target_g", "Белок, г", "numeric"],
  ["water_target_l", "Вода, л", "decimal"],
  ["steps_target", "Цель шагов", "numeric"],
] as const;

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProfile().then((value) => { if (active) setProfile(value); })
      .catch(() => { if (active) setError("Не удалось загрузить профиль."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError("");
    try { await saveProfile(profile); setSaved(true); }
    catch { setError("Не удалось сохранить профиль. Попробуйте ещё раз."); }
    finally { setSaving(false); }
  }

  return <AppShell><main className="page"><div className="container">
    <div className="hero-row"><div><div className="eyebrow">Профиль</div><h1>Настройки</h1>
      <p className="lead">Параметры программы и цели на главном экране.</p></div>
      <button className="btn" onClick={save} disabled={loading || saving}><Save size={17}/>{saving ? "Сохраняем…" : saved ? "Сохранено" : "Сохранить"}</button>
    </div>
    {error && <div className="notice" role="alert">{error}</div>}
    {loading && <div className="card" role="status">Загружаем профиль…</div>}
    <div className="split"><section className="card"><div className="form-grid">
      {fields.map(([key, label, input]) => <label className="field" key={key}><span>{label}</span>
        <input className="input" type={input === "date" ? "date" : "text"}
          inputMode={input === "decimal" || input === "numeric" ? input : undefined}
          value={profile[key]} onChange={(event) => setProfile({
            ...profile,
            [key]: input === "text" || input === "date" ? event.target.value : Number(event.target.value),
          })}/>
      </label>)}
    </div></section><aside className="card sticky"><UserRound size={28} color="var(--accent)"/>
      <h2 style={{ marginTop: 16 }}>Аккаунт</h2>
      <p className="meal-desc">Ваши данные синхронизируются с аккаунтом.</p>
      <LogoutButton />
      <p className="install-hint" style={{ marginTop: 16 }}>На iPhone: Safari → Поделиться → «На экран Домой».</p>
    </aside></div>
  </div></main></AppShell>;
}
