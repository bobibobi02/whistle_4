// pages/chat.tsx
import Head from "next/head";
import MessagingUI from "@/components/MessagingUI";
import VideoChatRoom from "@/components/VideoChatRoom";
import EncryptedMessage from "@/components/EncryptedMessage";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Prefer explicit query first, then derive a stable fallback.
  const queryRoom =
    (router.query.roomId as string) ||
    (router.query.room as string) ||
    "";

  // Stable fallback: session email (lowercased), else "general"
  const roomFallback =
    (session?.user?.email && String(session.user.email).toLowerCase()) ||
    "general";

  const roomId = (queryRoom || roomFallback).trim();

  // recipientId from query (?recipientId= or ?to=), else safe default
  const queryRecipient =
    (router.query.recipientId as string) ||
    (router.query.to as string) ||
    "";

  const recipientId = (queryRecipient || "general").trim();

  return (
    <>
      <Head>
        <title>Chat  Whistle</title>
      </Head>
      <div className="container">
        <MessagingUI />
        {/* VideoChatRoom requires a roomId prop */}
        <VideoChatRoom roomId={roomId as any} />
        <EncryptedMessage recipientId={recipientId as any} />
      </div>
    </>
  );
}

