"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    if (!supabase) return;

    await supabase.auth.signOut();

    router.replace("/auth");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn ghost"
      onClick={logout}
    >
      <LogOut size={16} />
      Выйти
    </button>
  );
}
