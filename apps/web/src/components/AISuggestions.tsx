export default function AISuggestions({ keywords }) {
  if (!keywords?.length) return null;

  return (
    <div className="bg-purple-100 border p-4 mb-4 rounded">
      <h2 className="text-lg font-semibold mb-2">  AI Suggestions</h2>
      <ul className="list-disc pl-5">
        {keywords.map((kw, i) => (
          <li key={i}>How about writing on: <strong>{kw}</strong>?</li>
        ))}
      </ul>
    </div>
  );
}

