"use client";

import React from "react";
import Link from "next/link";
import {
  Brain,
  LayoutDashboard,
  ClipboardList,
  FileText,
  Sparkles,
  Search,
  Bell,
  UserCircle2,
  BarChart3,
} from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white">
        <div>
          <div className="flex items-center gap-2 px-6 py-6">
            <Brain className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-bold text-slate-800">
              Blindmind-Health
            </span>
          </div>

          <nav className="mt-2 flex flex-col gap-2 px-3">
            <SidebarItem
              icon={<LayoutDashboard className="h-5 w-5" />}
              label="Dashboard"
              href="/"
            />
            <SidebarItem
              icon={<ClipboardList className="h-5 w-5" />}
              label="Health Logs"
              href="/health-logs"
            />
            <SidebarItem
              icon={<FileText className="h-5 w-5" />}
              label="Reports"
              href="/reports"
              active
            />
          </nav>
        </div>

        <div className="m-4 rounded-xl bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">
              Upgrade to Premium
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Unlock advanced health insights and unlimited reports.
          </p>
          <button className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
            Upgrade Now
          </button>
        </div>
      </aside>

      {/* ---------------- HEADER ---------------- */}
      <header className="fixed left-64 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-5">
          <button className="relative text-slate-500 hover:text-slate-700">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-800">Saiem</span>
              <span className="text-xs font-medium text-green-600">
                Premium
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="ml-64 mt-16 min-h-[calc(100vh-4rem)] p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Reports &amp; Analytics
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Detailed insights into your health trends over time.
          </p>
        </div>

        {/* Empty State */}
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-center shadow-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-800">
            No Reports Yet
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-500">
            Detailed reports will be generated here.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Reusable Sidebar Item ---------------- */
function SidebarItem({
  icon,
  label,
  href,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}