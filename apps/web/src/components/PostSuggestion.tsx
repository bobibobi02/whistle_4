export default function PostSuggestion({ suggestions }) {
  return (
    <div className="border p-4 bg-yellow-50 rounded mb-4">
      <h3 className="font-bold mb-2">Before you post, check these similar topics:</h3>
      <ul className="list-disc pl-5 space-y-1">
        {suggestions.map((s, i) => <li key={i}>{s.title}</li>)}
      </ul>
    </div>
  );
}
