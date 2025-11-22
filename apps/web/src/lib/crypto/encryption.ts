import * as nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

// Generate a new keypair
export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}

// Encrypt a message with recipient's public key and sender's secret key
export function encryptMessage(message: string, recipientPub: string, senderSecret: string) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(
    new TextEncoder().encode(message),
    nonce,
    decodeBase64(recipientPub),
    decodeBase64(senderSecret)
  );
  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(encrypted),
  };
}

// Decrypt a message with sender's public key and recipient's secret key
export function decryptMessage(ciphertext: string, nonce: string, senderPub: string, recipientSecret: string) {
  const decrypted = nacl.box.open(
    decodeBase64(ciphertext),
    decodeBase64(nonce),
    decodeBase64(senderPub),
    decodeBase64(recipientSecret)
  );
  if (!decrypted) throw new Error('Decryption failed');
  return new TextDecoder().decode(decrypted);
}
