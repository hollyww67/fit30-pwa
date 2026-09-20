"use client";

import { createClient } from "@/lib/supabase/client";
import { defaultProfile } from "@/lib/data/program";

export type Profile = typeof defaultProfile & { id?: string };
export type DailyCheckin = {
  date: string;
  weight_kg?: number | null;
  steps?: number | null;
  water_l?: number | null;
  sleep_hours?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  workout_status?: "not_started" | "partial" | "done" | "skipped";
  notes?: string | null;
};
export type Measurement = {
  date: string;
  waist_cm?: number | null;
  abdomen_cm?: number | null;
  hips_cm?: number | null;
  chest_cm?: number | null;
  thigh_cm?: number | null;
  arm_cm?: number | null;
};

type LocalState = {
  profile: Profile;
  checkins: Record<string, DailyCheckin>;
  meals: Record<string, Record<string, boolean>>;
  measurements: Measurement[];
  completedDays: number[];
  setLogs: Record<string, { weight: number; reps: number; done: boolean }>;
};

const STORAGE_KEY = "fit30-state-v1";

function localRead(): LocalState {
  if (typeof window === "undefined") {
    return { profile: defaultProfile, checkins: {}, meals: {}, measurements: [], completedDays: [], setLogs: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    return { profile: defaultProfile, checkins: {}, meals: {}, measurements: [], completedDays: [], setLogs: {}, ...JSON.parse(raw) };
  } catch {
    return { profile: defaultProfile, checkins: {}, meals: {}, measurements: [], completedDays: [], setLogs: {} };
  }
}

function localWrite(state: LocalState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function currentUserId() {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getProfile(): Promise<Profile> {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) return { ...defaultProfile, ...data } as Profile;
  }
  return localRead().profile;
}

export async function saveProfile(profile: Profile) {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { error } = await supabase.from("profiles").upsert({ ...profile, id: userId }, { onConflict: "id" });
    if (error) throw error;
    return;
  }
  const state = localRead();
  state.profile = profile;
  localWrite(state);
}

export async function getCheckin(date: string): Promise<DailyCheckin> {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { data } = await supabase.from("daily_checkins").select("*").eq("user_id", userId).eq("date", date).maybeSingle();
    if (data) return data as DailyCheckin;
  }
  return localRead().checkins[date] ?? { date, workout_status: "not_started" };
}

export async function saveCheckin(checkin: DailyCheckin) {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { error } = await supabase.from("daily_checkins").upsert({ ...checkin, user_id: userId }, { onConflict: "user_id,date" });
    if (error) throw error;
    return;
  }
  const state = localRead();
  state.checkins[checkin.date] = checkin;
  localWrite(state);
}

export async function getCheckins(): Promise<DailyCheckin[]> {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { data } = await supabase.from("daily_checkins").select("*").eq("user_id", userId).order("date", { ascending: true });
    return (data ?? []) as DailyCheckin[];
  }
  return Object.values(localRead().checkins).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getMealChecks(date: string): Promise<Record<string, boolean>> {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { data } = await supabase.from("meal_checks").select("meal_key,completed").eq("user_id", userId).eq("date", date);
    return Object.fromEntries((data ?? []).map((x) => [x.meal_key, x.completed]));
  }
  return localRead().meals[date] ?? {};
}

export async function setMealCheck(date: string, mealKey: string, completed: boolean) {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { error } = await supabase.from("meal_checks").upsert({ user_id: userId, date, meal_key: mealKey, completed }, { onConflict: "user_id,date,meal_key" });
    if (error) throw error;
    return;
  }
  const state = localRead();
  state.meals[date] = { ...(state.meals[date] ?? {}), [mealKey]: completed };
  localWrite(state);
}

export async function saveMeasurement(measurement: Measurement) {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { error } = await supabase.from("body_measurements").upsert({ ...measurement, user_id: userId }, { onConflict: "user_id,date" });
    if (error) throw error;
    return;
  }
  const state = localRead();
  state.measurements = [...state.measurements.filter((x) => x.date !== measurement.date), measurement].sort((a,b) => a.date.localeCompare(b.date));
  localWrite(state);
}

export async function getMeasurements(): Promise<Measurement[]> {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { data } = await supabase.from("body_measurements").select("*").eq("user_id", userId).order("date", { ascending: true });
    return (data ?? []) as Measurement[];
  }
  return localRead().measurements;
}

export async function markProgramDay(day: number, complete: boolean) {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { error } = await supabase.from("program_day_status").upsert({ user_id: userId, program_day: day, completed: complete }, { onConflict: "user_id,program_day" });
    if (error) throw error;
    return;
  }
  const state = localRead();
  state.completedDays = complete
    ? Array.from(new Set([...state.completedDays, day])).sort((a,b) => a-b)
    : state.completedDays.filter((d) => d !== day);
  localWrite(state);
}

export async function getCompletedDays(): Promise<number[]> {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { data } = await supabase.from("program_day_status").select("program_day").eq("user_id", userId).eq("completed", true);
    return (data ?? []).map((x) => x.program_day);
  }
  return localRead().completedDays;
}

export function isCloudMode() {
  return Boolean(createClient());
}

export async function startWorkoutSession(programDay: number, workoutCode: string) {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId) {
    const { data, error } = await supabase.from("workout_sessions").insert({ user_id: userId, program_day: programDay, workout_code: workoutCode }).select("id").single();
    if (error) throw error;
    return data.id as string;
  }
  return `local-${programDay}-${Date.now()}`;
}

export async function saveWorkoutSet(sessionId: string, exerciseKey: string, setNumber: number, weight: number | null, reps: number | null, completed = true) {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId && !sessionId.startsWith("local-")) {
    const { error } = await supabase.from("workout_sets").insert({ session_id: sessionId, user_id: userId, exercise_key: exerciseKey, set_number: setNumber, weight_kg: weight, reps, completed });
    if (error) throw error;
    return;
  }
  const state = localRead();
  state.setLogs[`${sessionId}:${exerciseKey}:${setNumber}`] = { weight: weight ?? 0, reps: reps ?? 0, done: completed };
  localWrite(state);
}

export async function finishWorkoutSession(sessionId: string, programDay: number, durationMin: number, rpe?: number) {
  const supabase = createClient();
  const userId = await currentUserId();
  if (supabase && userId && !sessionId.startsWith("local-")) {
    const { error } = await supabase.from("workout_sessions").update({ status: "completed", duration_min: durationMin, rpe: rpe ?? null, completed_at: new Date().toISOString() }).eq("id", sessionId).eq("user_id", userId);
    if (error) throw error;
  }
  await markProgramDay(programDay, true);
}
