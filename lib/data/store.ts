"use client";

import { createClient } from "@/lib/supabase/client";
import { defaultProfile } from "@/lib/data/program";

export type Profile = typeof defaultProfile & { id?: string };
export type DailyCheckin = {
  date: string; weight_kg?: number | null; steps?: number | null; water_l?: number | null;
  sleep_hours?: number | null; calories?: number | null; protein_g?: number | null;
  workout_status?: "not_started" | "partial" | "done" | "skipped"; notes?: string | null;
};
export type Measurement = {
  date: string; waist_cm?: number | null; abdomen_cm?: number | null; hips_cm?: number | null;
  chest_cm?: number | null; thigh_cm?: number | null; arm_cm?: number | null;
};

async function connection() {
  const client = createClient();
  if (!client) throw new Error("Supabase не настроен.");
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Сессия истекла. Войдите снова.");
  return { client, userId: data.user.id };
}

function ensure(error: { message: string } | null) {
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("Supabase:", error);
    throw new Error("Не удалось сохранить или загрузить данные. Попробуйте ещё раз.");
  }
}

export async function getProfile(): Promise<Profile> {
  const { client, userId } = await connection();
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  ensure(error);
  return { ...defaultProfile, ...data } as Profile;
}
export async function saveProfile(profile: Profile) {
  const { client, userId } = await connection();
  const { id: _id, ...fields } = profile;
  void _id;
  const { error } = await client.from("profiles").upsert({ ...fields, id: userId }, { onConflict: "id" });
  ensure(error);
}
export async function getCheckin(date: string): Promise<DailyCheckin> {
  const { client, userId } = await connection();
  const { data, error } = await client.from("daily_checkins").select("*").eq("user_id", userId).eq("date", date).maybeSingle();
  ensure(error);
  return (data as DailyCheckin | null) ?? { date, workout_status: "not_started" };
}
export async function saveCheckin(checkin: DailyCheckin) {
  const { client, userId } = await connection();
  const { error } = await client.from("daily_checkins").upsert({ ...checkin, user_id: userId }, { onConflict: "user_id,date" });
  ensure(error);
}
export async function getCheckins(): Promise<DailyCheckin[]> {
  const { client, userId } = await connection();
  const { data, error } = await client.from("daily_checkins").select("*").eq("user_id", userId).order("date", { ascending: true });
  ensure(error);
  return (data ?? []) as DailyCheckin[];
}
export async function getMealChecks(date: string): Promise<Record<string, boolean>> {
  const { client, userId } = await connection();
  const { data, error } = await client.from("meal_checks").select("meal_key,completed").eq("user_id", userId).eq("date", date);
  ensure(error);
  return Object.fromEntries((data ?? []).map(({ meal_key, completed }) => [meal_key, completed]));
}
export async function setMealCheck(date: string, mealKey: string, completed: boolean) {
  const { client, userId } = await connection();
  const { error } = await client.from("meal_checks").upsert({ user_id: userId, date, meal_key: mealKey, completed }, { onConflict: "user_id,date,meal_key" });
  ensure(error);
}
export async function saveMeasurement(measurement: Measurement) {
  const { client, userId } = await connection();
  const { error } = await client.from("body_measurements").upsert({ ...measurement, user_id: userId }, { onConflict: "user_id,date" });
  ensure(error);
}
export async function getMeasurements(): Promise<Measurement[]> {
  const { client, userId } = await connection();
  const { data, error } = await client.from("body_measurements").select("*").eq("user_id", userId).order("date", { ascending: true });
  ensure(error);
  return (data ?? []) as Measurement[];
}
export async function markProgramDay(day: number, complete: boolean) {
  const { client, userId } = await connection();
  const { error } = await client.from("program_day_status").upsert({ user_id: userId, program_day: day, completed: complete, completed_at: complete ? new Date().toISOString() : null }, { onConflict: "user_id,program_day" });
  ensure(error);
}
export async function getCompletedDays(): Promise<number[]> {
  const { client, userId } = await connection();
  const { data, error } = await client.from("program_day_status").select("program_day").eq("user_id", userId).eq("completed", true);
  ensure(error);
  return (data ?? []).map(({ program_day }) => program_day);
}
export function isCloudMode() { return Boolean(createClient()); }
export async function startWorkoutSession(programDay: number, workoutCode: string) {
  const { client, userId } = await connection();
  const { data, error } = await client.from("workout_sessions").insert({ user_id: userId, program_day: programDay, workout_code: workoutCode }).select("id").single();
  ensure(error);
  return data!.id as string;
}
export async function saveWorkoutSet(sessionId: string, exerciseKey: string, setNumber: number, weight: number | null, reps: number | null, completed = true, rpe?: number | null) {
  const { client, userId } = await connection();
  const { error } = await client.from("workout_sets").upsert({ session_id: sessionId, user_id: userId, exercise_key: exerciseKey, set_number: setNumber, weight_kg: weight, reps, completed, rpe: rpe ?? null }, { onConflict: "session_id,exercise_key,set_number" });
  ensure(error);
}
export async function finishWorkoutSession(sessionId: string, programDay: number, durationMin: number, rpe?: number) {
  const { client, userId } = await connection();
  const { error } = await client.from("workout_sessions").update({ status: "completed", duration_min: durationMin, rpe: rpe ?? null, completed_at: new Date().toISOString() }).eq("id", sessionId).eq("user_id", userId);
  ensure(error);
  await markProgramDay(programDay, true);
}
