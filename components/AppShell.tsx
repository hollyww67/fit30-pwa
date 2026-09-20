"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, Home, LineChart, UtensilsCrossed } from "lucide-react";
import { isCloudMode } from "@/lib/data/store";

const nav = [
  { href: "/today", label: "Сегодня", icon: Home },
  { href: "/program", label: "План", icon: CalendarDays },
  { href: "/workouts/A", label: "Тренировка", icon: Dumbbell },
  { href: "/nutrition", label: "Питание", icon: UtensilsCrossed },
  { href: "/progress", label: "Прогресс", icon: LineChart },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cloud = isCloudMode();
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/today" className="brand" aria-label="Fit30">
            <span className="brand-mark">F</span>
            <span>Fit30</span>
          </Link>
          <div className="cloud-pill" title={cloud ? "Supabase подключён" : "Демо-режим: данные хранятся на устройстве"}>
            <span className="cloud-dot" style={!cloud ? { background: "#ffd166" } : undefined} />
            {cloud ? "Cloud sync" : "Demo mode"}
          </div>
        </div>
      </header>
      {children}
      <nav className="bottom-nav" aria-label="Основная навигация">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/today" && pathname.startsWith(href.split("/").slice(0, 2).join("/")));
          return (
            <Link href={href} className={`nav-item ${active ? "active" : ""}`} key={href}>
              <Icon size={19} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
