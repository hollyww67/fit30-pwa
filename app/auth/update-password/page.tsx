"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError("Сервис входа временно недоступен.");
      setLoading(false);
      return;
    }

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);

      return;
    }

    router.replace("/today");
    router.refresh();
  }

  return (
    <main className="page">
      <div
        className="container"
        style={{
          maxWidth: 520,
          paddingTop: 80,
        }}
      >
        <section className="card">
          <div className="eyebrow">
            Безопасность
          </div>

          <h1>Новый пароль</h1>

          <form
            onSubmit={submit}
            style={{
              display: "grid",
              gap: 14,
              marginTop: 24,
            }}
          >
            <input
              className="input"
              type="password"
              value={password}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Новый пароль, минимум 8 символов"
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />

            <input
              className="input"
              type="password"
              value={confirmPassword}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Повтори новый пароль"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            {error && (
              <div className="notice">
                {error}
              </div>
            )}

            <button
              className="btn"
              disabled={loading}
            >
              {loading
                ? "Сохраняем..."
                : "Сохранить пароль"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
