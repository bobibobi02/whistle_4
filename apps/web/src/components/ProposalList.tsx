'use client';
import { useEffect, useState } from 'react';

type Proposal = {
  id: string;
  title: string;
  description: string;
  createdBy: { email: string };
  votes: { weight: number }[];
};

export default function ProposalList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const fetchProposals = async () => {
    const res = await fetch('/api/governance/proposals');
    if (res.ok) setProposals(await res.json());
  };

  useEffect(() => { fetchProposals(); }, []);

  return (
    <div>
      {proposals.map(p => (
        <div key={p.id} className="border p-4 rounded mb-4">
          <h4 className="text-lg font-bold">{p.title}</h4>
          <p className="text-sm text-gray-600">by {p.createdBy.email}</p>
          <p className="mt-2">{p.description}</p>
          <p className="mt-2">Votes: {p.votes.reduce((sum, v) => sum + v.weight, 0)}</p>
          <button onClick={() => window.alert('Vote coming soon')} className="mt-2 px-2 py-1 bg-green-500 text-white rounded">Vote</button>
        </div>
      ))}
    </div>
);
}
