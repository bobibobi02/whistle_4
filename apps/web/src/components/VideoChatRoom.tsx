// src/components/VideoChatRoom.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPeer } from "@/lib/webrtc/peer";

type SignalMessage =
  | { type: "join"; roomId: string }
  | { type: "offer"; signal: any; to?: string; from?: string }
  | { type: "answer"; signal: any; to?: string; from?: string }
  | { type: "ready"; from: string } // optional, when another client is ready
  | { type: "disconnect"; from: string }
  | { type: string; [k: string]: any };

interface VideoChatRoomProps {
  roomId: string | number;
}

export default function VideoChatRoom({ roomId }: VideoChatRoomProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // peers keyed by remote client id
  const peersRef = useRef<Record<string, any>>({});
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // 1) Get local media
  useEffect(() => {
    let cancelled = false;

    async function enableMedia() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) return;

        setStream(userStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userStream;
        }
      } catch (err) {
        console.error("getUserMedia error:", err);
      }
    }

    enableMedia();
    return () => {
      cancelled = true;
      // stop local tracks on unmount
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Open signaling socket once we have media
  useEffect(() => {
    if (!stream) return;
    if (typeof window === "undefined") return;

    const wsUrl = `ws://${window.location.host}/api/webrtc/signaling?roomId=${roomId}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", roomId } satisfies SignalMessage));
    };

    socket.onmessage = async (ev: MessageEvent) => {
      try {
        const data: SignalMessage = JSON.parse(ev.data);

        // Another peer is ready; we initiate and send an offer
        if (data.type === "ready") {
          const peer = await createPeer(true, stream);
          wirePeerEvents(peer, data.from); // sets .on('signal') and .on('stream')

          peersRef.current[data.from] = peer;
        }

        // We received an offer; we create a non-initiator peer and answer
        if (data.type === "offer" && data.from) {
          const peer = await createPeer(false, stream);
          peer.on("signal", (signal: any) => {
            socketRef.current?.send(
              JSON.stringify({ type: "answer", signal, to: data.from } as SignalMessage)
            );
          });
          wirePeerStream(peer);
          peersRef.current[data.from] = peer;

          peer.signal((data as any).signal);
        }

        // We received an answer to an offer we previously sent
        if (data.type === "answer" && data.from) {
          const peer = peersRef.current[data.from];
          if (peer) {
            peer.signal((data as any).signal);
          }
        }

        // Remote disconnected
        if (data.type === "disconnect" && data.from) {
          const peer = peersRef.current[data.from];
          if (peer) {
            try {
              peer.destroy?.();
            } catch {}
            delete peersRef.current[data.from];
          }
          setRemoteStreams((prev) =>
            prev.filter((ms) => ms.id !== data.from) // if you keyed by id
          );
        }
      } catch (e) {
        console.error("WS message parse/handle error:", e);
      }
    };

    socket.onclose = () => {
      // cleanup peers
      Object.values(peersRef.current).forEach((p: any) => {
        try {
          p.destroy?.();
        } catch {}
      });
      peersRef.current = {};
    };

    return () => {
      try {
        socket.close();
      } catch {}
    };
  }, [roomId, stream]);

  /**
   * Wire up a newly-created peer for signaling (offer path)
   * Sends an "offer" to the remote client id when peer emits 'signal'
   */
  function wirePeerEvents(peer: any, remoteId: string) {
    peer.on("signal", (signal: any) => {
      socketRef.current?.send(
        JSON.stringify({ type: "offer", signal, to: remoteId } as SignalMessage)
      );
    });
    wirePeerStream(peer);
  }

  /**
   * Wire up the 'stream' event for a peer and add to UI
   */
  function wirePeerStream(peer: any) {
    peer.on("stream", (remoteStream: MediaStream) => {
      setRemoteStreams((prev) => {
        // Avoid duplicates (some browsers may emit multiple times)
        if (prev.some((s) => s.id === remoteStream.id)) return prev;
        return [...prev, remoteStream];
      });
    });
    peer.on?.("error", (err: any) => console.error("peer error:", err));
    peer.on?.("close", () => {
      // Optional: remove its stream when peer closes (requires mapping peer->stream)
    });
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Video Chat</h3>
      <div className="flex gap-4 flex-wrap">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{ width: 240, background: "#000" }}
        />
        {remoteStreams.map((remoteStream) => (
          <video
            key={remoteStream.id}
            autoPlay
            playsInline
            style={{ width: 240, background: "#000" }}
            ref={(el) => {
              if (el && el.srcObject !== remoteStream) {
                el.srcObject = remoteStream;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
