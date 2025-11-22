'use client';
import { useState } from 'react';

export default function ProposalForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const res = await fetch('/api/governance/proposals', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ title, description })
    });
    if (res.ok) {
      setTitle('');
      setDescription('');
      onSuccess?.();
    } else {
      const { message } = await res.json();
      setError(message || 'Error creating proposal');
    }
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h3 className="font-semibold mb-2">New Proposal</h3>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full p-2 border rounded mb-2"
        rows={4}
      />
      <button onClick={submit} className="px-3 py-1 bg-blue-500 text-white rounded">Propose</button>
    </div>
);
}
