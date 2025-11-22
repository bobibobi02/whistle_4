import { useEffect, useState } from "react";

interface ModEvent {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  moderatorId: string;
  createdAt: string;
}

export default function RealTimeAlerts() {
  const [events, setEvents] = useState<ModEvent[]>([]);

  useEffect(() => {
    const es = new EventSource("/api/mod/stream");
    es.onmessage = (e) => {
      const event: ModEvent = JSON.parse(e.data);
      setEvents((prev) => [event, ...prev]);
      // Optionally: show a toast notification here
    };
    return () => {
      es.close();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 max-w-sm space-y-2">
      {events.slice(0, 5).map(evt => (
        <div key={evt.id} className="bg-white p-3 rounded shadow">
          <div className="text-sm font-bold">{evt.type.replace('_', ' ')}</div>
          <div className="text-xs">{evt.targetType} ID: {evt.targetId}</div>
          <div className="text-xs text-gray-500">{new Date(evt.createdAt).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
}
