import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";

export default function StrikeControls({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const router = useRouter();

  if (!session?.user) return null;

  const addStrike = async () => {
    if (!reason) return alert('Reason required');
    const res = await fetch('/api/mod/addStrike', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason, expiresAt: expiresAt || null })
    });
    if (res.ok) {
      router.reload();
    } else {
      alert('Failed to add strike');
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h2 className="font-bold mb-2">Add Strike</h2>
      <textarea
        className="w-full p-2 border rounded mb-2"
        placeholder="Reason"
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <input
        type="datetime-local"
        className="w-full p-2 border rounded mb-2"
        value={expiresAt}
        onChange={e => setExpiresAt(e.target.value)}
      />
      <button onClick={addStrike} className="px-4 py-2 bg-blue-500 text-white rounded">Add Strike</button>
    </div>
);
}
