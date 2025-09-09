"use client";
import { ReactNode } from "react";

interface PremiumShellProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}

export default function PremiumShell({ title, subtitle, right, children }: PremiumShellProps) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
      <main className="space-y-5">
        <header className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="p-hero text-slate-900 dark:text-white">{title}</div>
          {subtitle && <div className="mt-1 text-sm p-muted">{subtitle}</div>}
        </header>
        {children}
      </main>
      {right && (
        <aside className="sticky top-4 h-fit rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {right}
        </aside>
      )}
    </div>
  );
}