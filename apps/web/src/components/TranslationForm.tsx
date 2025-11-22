'use client';
import { useState } from 'react';

export default function TranslationForm({ locale, key, onSuccess }) {
  const [text, setText] = useState('');

  const submit = async () => {
    const res = await fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, key, text })
    });
    if (res.ok) {
      setText('');
      onSuccess?.();
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Submit Translation ({locale})</h3>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full p-2 border rounded mb-2"
        rows={4}
      />
      <button onClick={submit} className="px-3 py-1 bg-blue-500 text-white rounded">
        Submit
      </button>
    </div>
  );
}
