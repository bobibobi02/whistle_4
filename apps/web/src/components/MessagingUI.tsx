import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  fromId: string;
  body: string;
  createdAt: string;
  from: { email: string };
}

export default function MessagingUI() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [toEmail, setToEmail] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (session) {
      fetch('/api/messages')
        .then(res => res.json())
        .then(setMessages);
    }
  }, [session]);

  const sendMessage = async () => {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toId: toEmail, body })
    });
    setBody('');
    // Optionally refresh messages
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="font-bold mb-2">Messaging</h2>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Recipient user ID"
          value={toEmail}
          onChange={e => setToEmail(e.target.value)}
          className="border p-1 rounded w-full"
        />
      </div>
      <textarea
        placeholder="Your message..."
        value={body}
        onChange={e => setBody(e.target.value)}
        className="border p-1 rounded w-full mb-2"
      />
      <button onClick={sendMessage} className="bg-green-500 text-white px-3 py-1 rounded">
        Send
      </button>
      <ul className="mt-4 space-y-2">
        {messages.map(m => (
          <li key={m.id} className="p-2 border rounded">
            <div className="text-sm text-gray-600">From: {m.from.email}</div>
            <div>{m.body}</div>
            <div className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
);
}
