"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (mode === "register" && password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    try {
      if (!supabase) throw new Error("Сервис входа временно недоступен.");
      if (mode === "login") {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          throw error;
        }

        router.replace("/today");
        router.refresh();

        return;
      }

      const origin = window.location.origin;

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,

          options: {
            emailRedirectTo:
              `${origin}/auth/callback`,
          },
        });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.replace("/today");
        router.refresh();
      } else {
        setMessage(
          "Регистрация завершена. Проверь почту и подтверди email."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка"
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (loading) return;
    if (!email) {
      setError(
        "Сначала введи email для восстановления пароля."
      );

      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    if (!supabase) {
      setError("Сервис входа временно недоступен.");
      setLoading(false);
      return;
    }

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
      });
      if (error) throw error;
      setMessage("Если аккаунт существует, письмо для восстановления отправлено.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить письмо. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div
        className="container"
        style={{
          maxWidth: 520,
          paddingTop: 70,
          paddingBottom: 70,
        }}
      >
        <section className="card">
          <div
            style={{
              width: 54,
              height: 54,
              display: "grid",
              placeItems: "center",
              borderRadius: 16,
              marginBottom: 22,
              background: "rgba(183,243,75,.1)",
            }}
          >
            <Dumbbell size={26} />
          </div>

          <div className="eyebrow">
            FIT30
          </div>

          <h1 style={{ marginBottom: 8 }}>
            {mode === "login"
              ? "С возвращением"
              : "Создать аккаунт"}
          </h1>

          <p className="lead">
            {mode === "login"
              ? "Войди, чтобы продолжить программу."
              : "Создай аккаунт — прогресс будет храниться в Supabase."}
          </p>

          <form
            onSubmit={submit}
            style={{
              marginTop: 28,
              display: "grid",
              gap: 14,
            }}
          >
            <label>
              <div
                className="metric-label"
                style={{ marginBottom: 7 }}
              >
                Email
              </div>

              <div style={{ position: "relative" }}>
                <Mail
                  size={17}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 15,
                    opacity: 0.5,
                  }}
                />

                <input
                  className="input"
                  type="email"
                  value={email}
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  style={{
                    paddingLeft: 42,
                    width: "100%",
                  }}
                />
              </div>
            </label>

            <label>
              <div
                className="metric-label"
                style={{ marginBottom: 7 }}
              >
                Пароль
              </div>

              <div style={{ position: "relative" }}>
                <LockKeyhole
                  size={17}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 15,
                    opacity: 0.5,
                  }}
                />

                <input
                  className="input"
                  type="password"
                  value={password}
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  placeholder={mode === "register" ? "Минимум 8 символов" : "Пароль"}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  style={{
                    paddingLeft: 42,
                    width: "100%",
                  }}
                />
              </div>
            </label>

            {mode === "register" && (
              <label>
                <div className="metric-label" style={{ marginBottom: 7 }}>Повтори пароль</div>
                <input
                  className="input"
                  type="password"
                  value={confirmPassword}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Повтори пароль"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  style={{ width: "100%" }}
                />
              </label>
            )}

            {error && (
              <div className="notice">
                {error}
              </div>
            )}

            {message && (
              <div
                className="notice"
                style={{
                  borderColor:
                    "rgba(183,243,75,.3)",
                  background:
                    "rgba(183,243,75,.08)",
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <LoaderCircle
                  size={17}
                  className="spin"
                />
              ) : null}

              {mode === "login"
                ? "Войти"
                : "Создать аккаунт"}
            </button>
          </form>

          {mode === "login" && (
            <button
              type="button"
              onClick={resetPassword}
              disabled={loading}
              className="btn ghost"
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 10,
              }}
            >
              Забыли пароль?
            </button>
          )}

          <div
            style={{
              marginTop: 24,
              textAlign: "center",
            }}
          >
            <span style={{ opacity: 0.65 }}>
              {mode === "login"
                ? "Нет аккаунта?"
                : "Уже есть аккаунт?"}
            </span>{" "}

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login"
                    ? "register"
                    : "login"
                );

                setError("");
                setMessage("");
                setConfirmPassword("");
              }}
              style={{
                border: 0,
                padding: 0,
                color: "inherit",
                background: "transparent",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {mode === "login"
                ? "Регистрация"
                : "Войти"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
