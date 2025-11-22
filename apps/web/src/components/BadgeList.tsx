import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export default function BadgeList({ userId }: { userId: string }) {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    fetch(`/api/badges/getUserBadges?userId=${userId}`)
      .then(res => res.json())
      .then(setBadges);
  }, [userId]);

  if (!badges.length) return <p>No badges earned yet.</p>;

  return (
    <div className="flex space-x-4">
      {badges.map((ub: any) => (
        <div key={ub.id} className="text-center">
          {ub.badge.iconUrl && <Image src={ub.badge.iconUrl} alt={ub.badge.subforum} width={48} height={48} />}
          <div className="text-sm mt-1">{ub.badge.subforum}</div>
        </div>
      ))}
    </div>
  );
}
