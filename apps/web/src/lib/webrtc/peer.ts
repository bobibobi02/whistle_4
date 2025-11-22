// src/lib/webrtc/peer.ts

/**
 * Create a SimplePeer instance in the browser.
 * This function lazy-loads 'simple-peer' to avoid SSR build issues.
 */
export async function createPeer(initiator: boolean, stream: MediaStream) {
  if (typeof window === "undefined") {
    throw new Error("createPeer must be called in the browser");
  }

  const SimplePeer = (await import("simple-peer")).default;
  const peer = new SimplePeer({
    initiator,
    trickle: false,
    stream,
  });

  return peer;
}
