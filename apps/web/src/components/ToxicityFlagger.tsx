'use client';
import { useState } from 'react';

export default function ToxicityFlagger({ content }: { content: string }) {
  const [result, setResult] = useState<{ toxicityScore: number; flagged: boolean } | null>(null);

  const flag = async () => {
    const res = await fetch('/api/mod/ai/flagContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content, threshold: 0.7 })
    });
    const json = await res.json();
    setResult(json);
  };

  return (
    <div className="mt-4">
      <button onClick={flag} className="px-3 py-1 bg-red-500 text-white rounded">
        Analyze Toxicity
      </button>
      {result && (
        <div className="mt-2 p-2 border rounded">
          <p>Toxicity Score: {result.toxicityScore.toFixed(2)}</p>
          <p>
            {result.flagged
              ? ' This content is potentially toxic.'
              : ' Content appears safe.'}
          </p>
        </div>
      )}
    </div>
  );
}

