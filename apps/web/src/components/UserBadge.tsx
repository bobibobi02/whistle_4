export default function UserBadge({ badge, flair }) {
  if (!badge && !flair) return null;

  return (
    <div className="inline-flex items-center gap-2">
      {badge && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{badge}</span>}
      {flair && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs italic">{flair}</span>}
    </div>
  );
}
