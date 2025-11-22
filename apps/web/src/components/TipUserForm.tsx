'use client';
import { useState } from 'react';

export default function TipUserForm({ fromId, toId }: { fromId: string; toId: string }) {
  const [amount, setAmount] = useState(100);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const fetchPayment = async () => {
    const res = await fetch('/api/payments/tipUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromId, toId, amount }),
    });
    const data = await res.json();
    setClientSecret(data.clientSecret);
    // TODO: mount Stripe Elements with clientSecret to complete payment
  };

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h2 className="font-bold mb-2">Tip User</h2>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(parseInt(e.target.value))}
        className="border p-1 rounded mb-2"
      />
      <button onClick={fetchPayment} className="px-3 py-1 bg-green-500 text-white rounded">
        Tip ${amount/100}
      </button>
      {/* Stripe Elements will go here */}
    </div>
);
}
