'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscribeButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const handleSubscribe = async () => {
    setLoading(true);
    const res = await fetch('/api/payments/createCheckoutSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const { sessionId } = await res.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
  };
  return (
    <button onClick={handleSubscribe} disabled={loading} className="px-4 py-2 bg-yellow-500 text-white rounded">
      {loading ? 'Loading...' : 'Subscribe'}
    </button>
  );
}
