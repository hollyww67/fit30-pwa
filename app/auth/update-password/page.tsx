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

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

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
              minLength={6}
              placeholder="Новый пароль"
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
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