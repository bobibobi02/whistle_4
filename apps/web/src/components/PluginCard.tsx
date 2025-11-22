'use client';
import { useState } from 'react';

export default function PluginCard({ pkg }: { pkg: any }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const submitFeedback = async () => {
    await fetch(`/api/plugins/${pkg.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'currentUserId', rating, reviewText })
    });
    alert('Thanks for your feedback!');
  };

  const avgRating = pkg.ratings.length
    ? (pkg.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / pkg.ratings.length).toFixed(1)
    : 'N/A';

  return (
    <div className="border p-4 rounded mb-4">
      <h3 className="text-lg font-bold">{pkg.subforum}</h3>
      <p className="text-sm mb-2">{pkg.description}</p>
      <p>Average Rating: {avgRating}</p>
      <div className="mt-2">
        <label className="block mb-1">Your Rating (1-5):</label>
        <input
          type="number" min="1" max="5" value={rating}
          onChange={e => setRating(parseInt(e.target.value))}
          className="border p-1 w-16 rounded"
        />
        <textarea
          placeholder="Write a review..."
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          className="w-full p-2 border rounded mt-2 mb-2"
        />
        <button onClick={submitFeedback} className="px-3 py-1 bg-blue-500 text-white rounded">
          Submit Feedback
        </button>
      </div>
    </div>
);
}
