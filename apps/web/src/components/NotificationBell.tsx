import { useEffect, useState } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  message: string;
  postId?: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data));
  }, []);

  return (
    <div className="relative">
      <span className="text-white"></span>
      {notifications.length > 0 && (
        <div className="absolute right-0 mt-2 bg-white text-black shadow p-2 rounded w-64 z-10">
          <h4 className="font-bold">Notifications</h4>
          <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.postId ? `/post/${n.postId}` : "#"}
                  className="text-blue-600 hover:underline"
                >
                  {n.message}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

