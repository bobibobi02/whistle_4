// src/components/AnalyticsDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DailyItem = {
  // When this comes from /api/analytics, dates will be strings (JSON),
  // not Date objects.
  createdAt: string | Date;
  _count?: { id?: number };
  count?: number;
};

type TopSub = {
  subforum?: string;
  name?: string;
  posts?: unknown[]; // we only need .length
};

type AnalyticsPayload = {
  postsCount?: number;
  commentsCount?: number;
  usersCount?: number;
  dailyActivityRaw?: DailyItem[];
  topSubs?: TopSub[];
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload: AnalyticsPayload = await res.json();
        if (mounted) setData(payload);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load analytics");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="p-4 border rounded bg-red-50 text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return <p>Loading</p>;

  const postsCount = data.postsCount ?? 0;
  const commentsCount = data.commentsCount ?? 0;
  const usersCount = data.usersCount ?? 0;

  // Normalize daily data (date string + numeric count)
  const dailyData =
    (data.dailyActivityRaw ?? []).map((item) => {
      const d =
        typeof item.createdAt === "string"
          ? new Date(item.createdAt)
          : item.createdAt;
      const date = isNaN(d as any) ? "" : new Date(d).toISOString().slice(0, 10);
      const count =
        item._count?.id ??
        item.count ??
        // fallback if API returns { value } etc.
        // @ts-ignore
        item.value ??
        0;

      return { date, count: Number(count) || 0 };
    }) ?? [];

  const topSubs = (data.topSubs ?? []).map((sub) => {
    const name = sub.subforum ?? sub.name ?? "unknown";
    const postsLen = Array.isArray(sub.posts) ? sub.posts.length : 0;
    return { name, postsLen };
  });

  return (
    <div className="p-6 rounded border bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Posts</div>
          <div className="text-xl font-semibold">{postsCount}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Comments</div>
          <div className="text-xl font-semibold">{commentsCount}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Users</div>
          <div className="text-xl font-semibold">{usersCount}</div>
        </div>
      </div>

      <h2 className="text-xl mb-2">Daily Mod Actions (Last 30d)</h2>
      <div className="w-full h-72">
        <ResponsiveContainer>
          <LineChart data={dailyData}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-xl mt-6 mb-2">Top Subforums</h2>
      <ul className="list-disc pl-6">
        {topSubs.map((s) => (
          <li key={s.name}>
            {s.name} ({s.postsLen} posts)
          </li>
        ))}
      </ul>
    </div>
  );
}

