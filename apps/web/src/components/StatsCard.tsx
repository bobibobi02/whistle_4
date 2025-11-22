interface StatsCardProps {
  title: string;
  value: number;
}

export default function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="bg-white p-4 rounded shadow flex flex-col items-center">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
