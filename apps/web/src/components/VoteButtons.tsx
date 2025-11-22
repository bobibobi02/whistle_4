import { useState } from 'react';

type Props = {
  postId: string;
  initialVotes: number;
};

export function VoteButtons({ postId, initialVotes }: Props) {
  const [votes, setVotes] = useState(initialVotes);

  async function vote(value: number) {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, value }),
    });

    if (res.ok) {
      setVotes((prev) => prev + value);
    } else {
      alert('You must be logged in to vote.');
    }
  }

  return (
    <div className="flex flex-col items-center mr-4 text-gray-600">
      <button onClick={() => vote(1)} className="hover:text-green-600"> </button>
      <span>{votes}</span>
      <button onClick={() => vote(-1)} className="hover:text-red-600"></button>
    </div>
  );
}

