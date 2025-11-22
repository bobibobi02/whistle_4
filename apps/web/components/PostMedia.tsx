'use client';
import React from 'react';

/**
 * PostMedia
 * - Collects media URLs from a post object (tolerates various field names)
 * - Renders nothing if there is no media (no Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р РЋРІћСћР  Р’ Р  Р №Р  Р Р‹Р Р†РІС›РЎС›No mediaР  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р РЋРІћСћР  Р’ Р  Р №Р  Р Р‹Р РЋРІћСћ placeholder)
 * - Renders a simple responsive grid if media exist
 */
export default function PostMedia({
  post,
  className = '',
  rounded = 14,
}: {
  post: any;
  className?: string;
  rounded?: number;
}) {
  // Try to pull media from common fields
  const urls: string[] = [
    ...(Array.isArray(post?.mediaUrls) ? post.mediaUrls : []),
    ...(Array.isArray(post?.imageUrls) ? post.imageUrls : []),
    ...(Array.isArray(post?.images) ? post.images : []),
    ...(post?.image ? [post.image] : []),
    ...(post?.coverImage ? [post.coverImage] : []),
  ].filter(Boolean);

  if (!urls.length) return null; // <Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р РЋРІћСћР  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р Р‹Р РЋРЎв„ў key: no box if nothing to show

  // Simple 1Р  Р’ Р ™Р’ Р  Р’ Р Р†Р љР’ Р  Р’ Р ™Р’ Р  Р  Р  РІС™Р РЋРІћСћР  Р’ Р  РІ Р  Р’ Р Р†Р љРЎв„ўР  Р Р‹Р РЋРІћСћ3 image responsive grid
  const gridCols =
    urls.length === 1 ? '1fr' : urls.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr';

  return (
    <div
      className={className}
      style={{
        marginTop: 12,
        borderRadius: rounded,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.06)',
        background: 'linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02))',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: 6,
          padding: 6,
        }}
      >
        {urls.slice(0, 6).map((src: string, i: number) => (
          <a
            key={i}
            href={src}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              position: 'relative',
              background: '#0b0f14',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,.05)',
              aspectRatio: '16 / 9',
            }}
          >
            {}
            <img
              src={src}
              alt={`media-${i}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                // If an item fails to load, just hide that slot
                (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
              }}
            />
          </a>
        ))}
      </div>
    </div>
  );
}
