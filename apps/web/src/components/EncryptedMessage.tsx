'use client';
import { useState } from 'react';
import { encryptMessage, decryptMessage } from '@/lib/crypto/encryption';

type Props = { recipientId: string };
type CipherBundle = { nonce: string; ciphertext: string };

export default function EncryptedMessage({ recipientId }: Props) {
  const [input, setInput] = useState('');
  const [cipher, setCipher] = useState<CipherBundle | null>(null);
  const [plain, setPlain] = useState<string | null>(null);

  const sendEncrypted = async () => {
    const res = await fetch(`/api/crypto/getPublicKey?userId=${encodeURIComponent(recipientId)}`);
    const { publicKey } = await res.json();
    const senderSecret = localStorage.getItem('secretKey') || ''; // guard for null
    const { nonce, ciphertext } = encryptMessage(input, publicKey, senderSecret);
    setCipher({ nonce, ciphertext });
    setPlain(null);
    // TODO: send via your messaging API
  };

  const decryptEncrypted = async () => {
    if (!cipher) return;
    const senderPub = prompt('Sender public key:') || '';
    const secretKey = localStorage.getItem('secretKey') || '';
    const text = decryptMessage(cipher.ciphertext, cipher.nonce, senderPub, secretKey);
    setPlain(text);
  };

  return (
    <div className="mt-6 border p-4 rounded">
      <h3 className="font-semibold mb-2">Encrypted Message</h3>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        className="border rounded w-full p-2"
        placeholder={`Message to ${recipientId}`}
      />
      <div className="mt-2 space-x-2">
        <button onClick={sendEncrypted} className="px-3 py-1 rounded bg-blue-600 text-white">Encrypt &amp; Send</button>
        <button onClick={decryptEncrypted} disabled={!cipher} className="px-3 py-1 rounded bg-gray-700 text-white">
          Decrypt
        </button>
      </div>
      {cipher && (
        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
{JSON.stringify(cipher, null, 2)}
        </pre>
      )}
      {plain && <p className="mt-2">Decrypted: {plain}</p>}
    </div>
  );
}
