import { useEffect, useState } from 'react';

export default function ModerationPanel() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch('/api/moderation/reports')
      .then(res => res.json())
      .then(data => setReports(data));
  }, []);

  async function markAsSpam(postId) {
    await fetch('/api/moderation/mark-spam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    });
    setReports(prev => prev.filter(r => r.post?.id !== postId));
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Moderation Panel</h1>
      {reports.length === 0 ? (
        <p>No reports to review.</p>
      ) : (
        reports.map(r => (
          <div key={r.id} className="border rounded p-4 mb-4 bg-white">
            <p><strong>Reason:</strong> {r.reason}</p>
            <p className="text-sm text-gray-600">Reported by: {r.user.email}</p>
            {r.post && (
              <div>
                <p><strong>Post:</strong> {r.post.title}</p>
                <p>{r.post.content}</p>
                <button
                  className="text-sm text-red-600 underline"
                  onClick={() => markAsSpam(r.post.id)}
                >
                  Mark as Spam
                </button>
              </div>
            )}
            {r.comment && (
              <div>
                <p><strong>Comment:</strong> {r.comment.body}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
