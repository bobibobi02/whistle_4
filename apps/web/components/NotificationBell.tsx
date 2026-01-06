import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  post?: {
    id: string;
    title: string | null;
  } | null;
  fromUser?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type ApiResponse = {
  notifications: Notification[];
  unreadCount: number;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as ApiResponse;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch {
      // ignore
    }
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      void markAllRead();
    }
  }

  return (
    <div className="notification-wrapper">
      <button
        type="button"
        className="navbar-link notification-bell"
        onClick={toggleOpen}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Notifications</span>
            {loading && <span className="notification-loading">Loading…</span>}
          </div>
          {notifications.length === 0 ? (
            <div className="notification-empty">No notifications yet.</div>
          ) : (
            <ul className="notification-list">
              {notifications.map((n) => {
                const fromName =
                  n.fromUser?.name ??
                  n.fromUser?.email ??
                  "Someone";
                const postLink = n.post
                  ? `/post/${n.post.id}`
                  : undefined;

                const content = (
                  <>
                    <div className="notification-message">
                      {n.message}
                    </div>
                    <div className="notification-meta">
                      {fromName}
                    </div>
                  </>
                );

                return (
                  <li
                    key={n.id}
                    className={
                      "notification-item" +
                      (n.read ? " notification-read" : "")
                    }
                  >
                    {postLink ? (
                      <Link href={postLink} className="notification-link">
                        {content}
                      </Link>
                    ) : (
                      <div className="notification-link">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
