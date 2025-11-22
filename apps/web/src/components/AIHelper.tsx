import { useState } from 'react';

export default function AIHelper({ text }) {
  const [summary, setSummary] = useState('');
  const fetchSummary = async () => {
    const res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const json = await res.json();
    setSummary(json.summary);
  };

  return (
    <div className="p-4 border rounded mt-4">
      <button onClick={fetchSummary} className="px-3 py-1 bg-indigo-500 text-white rounded">
        Summarize Post
      </button>
      {summary && (
        <div className="mt-2 p-2 bg-gray-100 rounded">
          <h3 className="font-bold">Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
);
}
