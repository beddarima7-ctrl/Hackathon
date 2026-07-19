"use client";

import React, { useState } from "react";
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
  Calendar,
  Moon,
  Smile,
  TrendingUp,
  ChevronDown,
  Droplet,
  Plus,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const weeklyData = [
  { day: "Mon", value: 62 },
  { day: "Tue", value: 75 },
  { day: "Wed", value: 58 },
  { day: "Thu", value: 88 },
  { day: "Fri", value: 70 },
  { day: "Sat", value: 95 },
  { day: "Sun", value: 85 },
];

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              active
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
        {/* Hero Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Welcome back, Saiem! 👋
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Here&apos;s what&apos;s happening with your health today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-md">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium text-slate-400">
                  Today
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  Jul 19, 2026
                </span>
                <span className="text-xs text-slate-400">Sunday</span>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-md transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <StatCard
            icon={<Moon className="h-5 w-5 text-blue-600" />}
            title="Sleep Quality"
            value="85%"
            badgeText="Good"
            trendText="+12% from last week"
          />
          <StatCard
            icon={<Smile className="h-5 w-5 text-green-600" />}
            title="Mood Index"
            value="8.2 /10"
            badgeText="Great"
            trendText="+7% from last week"
          />
        </div>

        {/* Bottom Section */}
        <div className="mt-6 grid grid-cols-3 gap-6">
          {/* Weekly Health Progress */}
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                Weekly Health Progress
              </h2>
              <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                This Week
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    domain={[40, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#2563eb" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                Overall Health
              </button>
              <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
                Sleep
              </button>
              <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
                Activity
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                Recent Activities
              </h2>
              <button className="text-xs font-semibold text-blue-600 hover:underline">
                View All
              </button>
            </div>

            <div className="mt-4 flex flex-col">
              <ActivityItem
                icon={<Moon className="h-4 w-4 text-purple-500" />}
                iconBg="bg-purple-50"
                title="Sleep Logged"
                value="7h 20m"
                time="6:45 AM"
              />
              <ActivityItem
                icon={<Smile className="h-4 w-4 text-green-500" />}
                iconBg="bg-green-50"
                title="Mood Logged"
                value="Happy"
                time="6:40 AM"
              />
              <ActivityItem
                icon={<Droplet className="h-4 w-4 text-blue-500" />}
                iconBg="bg-blue-50"
                title="Water Intake"
                value="8 glasses"
                time="6:30 AM"
                last
              />
            </div>

            <button className="mt-4 w-full rounded-lg bg-slate-50 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              View All Activities
            </button>
          </div>
        </div>
      </main>

      {/* ---------------- ADD ENTRY MODAL ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Add Entry</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // teammate: attach API call here
                setIsModalOpen(false);
              }}
              className="mt-5 flex flex-col gap-4"
            >
              {/* Entry Type Dropdown */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Entry Type
                </label>
                <select
                  name="entryType"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="sleep">Sleep</option>
                  <option value="mood">Mood</option>
                </select>
              </div>

              {/* Value / Score Input */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Value / Score
                </label>
                <input
                  type="text"
                  name="value"
                  placeholder="e.g. 8 or Happy"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Actions */}
              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

/* ---------------- Reusable Stat Card ---------------- */
function StatCard({
  icon,
  title,
  value,
  badgeText,
  trendText,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  badgeText: string;
  trendText: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-slate-600">{title}</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-4xl font-bold text-slate-800">{value}</span>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
          {badgeText}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <TrendingUp className="h-4 w-4 text-green-600" />
        <span className="text-xs font-medium text-green-600">
          {trendText}
        </span>
      </div>
    </div>
  );
}

/* ---------------- Reusable Activity Item ---------------- */
function ActivityItem({
  icon,
  iconBg,
  title,
  value,
  time,
  last = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string;
  time: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3 ${
        last ? "" : "border-b border-slate-100"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-sm font-medium text-slate-800">{title}</span>
        <span className="text-xs text-slate-500">{value}</span>
      </div>
      <span className="text-xs text-slate-400">{time}</span>
    </div>
  );
}