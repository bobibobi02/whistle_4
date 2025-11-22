'use client';
import { useEffect, useState } from 'react';

export default function ModActionReviewer() {
  const [actions, setActions] = useState([]);
  useEffect(() => {
    fetch('/api/modactions/toReview')
      .then(res => res.json())
      .then(setActions);
  }, []);
  const review = async (id, agreed) => {
    await fetch('/api/modactions/review', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ modActionId: id, agreed })
    });
    setActions(actions.filter(a => a.id !== id));
  };
  if (!actions.length) return <p>No actions to review.</p>;
  return (
    <div>
      {actions.map(a => (
        <div key={a.id} className="border p-4 rounded mb-4">
          <p><strong>{a.type}</strong> on {a.targetType} {a.targetId}</p>
          {a.reason && <p>Reason: {a.reason}</p>}
          <p className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</p>
          <button onClick={() => review(a.id, true)} className="mr-2 px-2 py-1 bg-green-500 text-white rounded">Agree</button>
          <button onClick={() => review(a.id, false)} className="px-2 py-1 bg-red-500 text-white rounded">Disagree</button>
        </div>
      ))}
    </div>
  );
}
