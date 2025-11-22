'use client';
import { useState } from 'react';

export default function AppealForm({ onSuccess }: { onSuccess?: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const res = await fetch('/api/appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (res.ok) {
      setReason('');
      onSuccess?.();
    } else {
      const { message } = await res.json();
      setError(message || 'Failed to submit appeal');
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Submit Appeal</h3>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full p-2 border rounded mb-2"
        rows={4}
        placeholder="Describe your appeal..."
      />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <button onClick={submit} className="px-3 py-1 bg-blue-500 text-white rounded">
        Submit
      </button>
    </div>
);
}
