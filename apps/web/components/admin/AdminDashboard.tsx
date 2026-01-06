// components/admin/AdminDashboard.tsx
import React, { useMemo, useState } from "react";
import {
  Users,
  FileText,
  Clock,
  AlertTriangle,
  Search,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface PostRow {
  id: string;
  title: string;
  loopName: string;
  author: string;
  createdAt: string;
  comments: number;
  status: "published" | "reported" | "deleted";
}

interface MetricCardData {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

// ─────────────────────────────────────────────
// Fake data
// ─────────────────────────────────────────────
const metricCards: MetricCardData[] = [
  { title: "Total users", value: "12,847", icon: <Users className="h-5 w-5" /> },
  { title: "Total posts", value: "45,231", icon: <FileText className="h-5 w-5" /> },
  { title: "Posts in last 24h", value: "328", icon: <Clock className="h-5 w-5" /> },
  { title: "Reports waiting", value: "14", icon: <AlertTriangle className="h-5 w-5" /> },
];

const fakePosts: PostRow[] = [
  { id: "1", title: "Best coffee spots downtown", loopName: "FoodieLoop", author: "Sarah Chen", createdAt: "2024-12-13 09:15", comments: 24, status: "published" },
  { id: "2", title: "Weekend hiking trail recommendations", loopName: "OutdoorLoop", author: "Mike Johnson", createdAt: "2024-12-13 08:42", comments: 18, status: "published" },
  { id: "3", title: "New React 19 features overview", loopName: "TechLoop", author: "Emily Davis", createdAt: "2024-12-13 07:30", comments: 45, status: "published" },
  { id: "4", title: "Spam post with suspicious links", loopName: "GeneralLoop", author: "Unknown User", createdAt: "2024-12-12 23:15", comments: 2, status: "reported" },
  { id: "5", title: "Local band playing this Friday", loopName: "MusicLoop", author: "Alex Rivera", createdAt: "2024-12-12 21:00", comments: 31, status: "published" },
  { id: "6", title: "Inappropriate content removed", loopName: "PhotoLoop", author: "Deleted Account", createdAt: "2024-12-12 18:45", comments: 0, status: "deleted" },
  { id: "7", title: "Best pizza in the city?", loopName: "FoodieLoop", author: "Jordan Lee", createdAt: "2024-12-12 16:20", comments: 52, status: "published" },
  { id: "8", title: "Offensive language in comments", loopName: "SportsLoop", author: "Chris Martinez", createdAt: "2024-12-12 14:10", comments: 8, status: "reported" },
  { id: "9", title: "Startup funding tips for beginners", loopName: "BusinessLoop", author: "Priya Sharma", createdAt: "2024-12-12 12:00", comments: 29, status: "published" },
  { id: "10", title: "Yoga class schedule update", loopName: "FitnessLoop", author: "Luna Kim", createdAt: "2024-12-12 10:30", comments: 12, status: "published" },
  { id: "11", title: "Scam promotion deleted", loopName: "DealsLoop", author: "Spam Bot", createdAt: "2024-12-11 22:00", comments: 0, status: "deleted" },
  { id: "12", title: "Photography meetup this weekend", loopName: "PhotoLoop", author: "Omar Hassan", createdAt: "2024-12-11 19:45", comments: 15, status: "published" },
  { id: "13", title: "Hateful content flagged", loopName: "PoliticsLoop", author: "Anon123", createdAt: "2024-12-11 17:30", comments: 3, status: "reported" },
  { id: "14", title: "Book club meeting notes", loopName: "BooksLoop", author: "Rachel Green", createdAt: "2024-12-11 15:00", comments: 21, status: "published" },
  { id: "15", title: "Gaming tournament results", loopName: "GamingLoop", author: "Tyler Brooks", createdAt: "2024-12-11 12:30", comments: 67, status: "published" },
  { id: "16", title: "Misleading health advice", loopName: "HealthLoop", author: "Dr. Fake", createdAt: "2024-12-11 10:00", comments: 5, status: "reported" },
  { id: "17", title: "Art gallery opening next month", loopName: "ArtLoop", author: "Maya Patel", createdAt: "2024-12-10 20:15", comments: 19, status: "published" },
  { id: "18", title: "Removed for copyright violation", loopName: "MusicLoop", author: "Pirate Pete", createdAt: "2024-12-10 18:00", comments: 0, status: "deleted" },
];

// ─────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────
const StatusBadge: React.FC<{ status: PostRow["status"] }> = ({ status }) => {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";
  const styles: Record<PostRow["status"], string> = {
    published: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    reported: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    deleted: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`${base} ${styles[status]}`}>{label}</span>;
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | PostRow["status"]>("all");

  const filteredPosts = useMemo(
    () =>
      fakePosts.filter((post) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          post.title.toLowerCase().includes(q) ||
          post.author.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "all" || post.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [searchTerm, statusFilter],
  );

  const handleView = (postId: string) => {
    console.log("View post:", postId);
  };

  const handleHide = (postId: string) => {
    console.log("Hide post:", postId);
  };

  const handleDelete = (postId: string) => {
    console.log("Delete post:", postId);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 text-slate-50">
      {/* Page heading */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-50">
            Whistle control center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor activity, review reports, and keep your loops clean.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            BETA
          </span>
        </div>
      </section>

      {/* Metric cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <article
            key={card.title}
            className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm shadow-black/30"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {card.title}
                </p>
                <p className="text-2xl font-semibold text-slate-50">
                  {card.value}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                {card.icon}
              </div>
            </div>
            <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          </article>
        ))}
      </section>

      {/* Recent posts */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              Recent posts
            </h2>
            <p className="text-xs text-slate-400">
              Fake data for UI preview only – wire this up to real queries when
              you&apos;re ready.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Showing {filteredPosts.length} of {fakePosts.length} posts
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-700 bg-slate-950/80 px-9 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none ring-emerald-500/0 transition focus:border-emerald-500 focus:ring-emerald-500/60"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | PostRow["status"])
            }
            className="w-full rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500/0 transition focus:border-emerald-500 focus:ring-emerald-500/60 sm:w-48"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="reported">Reported</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-sm shadow-black/30">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Loop
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Author
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Created
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Comments
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No posts match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60"
                    >
                      <td className="max-w-xs px-4 py-3 text-sm font-medium text-slate-50">
                        <span className="block truncate">{post.title}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {post.loopName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {post.author}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {post.createdAt}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-300">
                        {post.comments}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleView(post.id)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 p-1.5 text-xs text-emerald-200 hover:border-emerald-500 hover:bg-emerald-500/10"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHide(post.id)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 p-1.5 text-xs text-amber-200 hover:border-amber-400 hover:bg-amber-400/10"
                            title="Hide"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(post.id)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 p-1.5 text-xs text-rose-200 hover:border-rose-500 hover:bg-rose-500/10"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
