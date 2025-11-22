import { useEffect, useState } from 'react';
import Link from 'next/link';

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  subforum: { subforum: string };
};

export default function PersonalizedFeed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch('/api/feed')
      .then(res => res.json())
      .then(setPosts);
  }, []);

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <div key={post.id} className="p-4 bg-white rounded shadow">
          <Link href={`/post/${post.id}`}>
            <a className="text-xl font-semibold hover:underline">{post.title}</a>
          </Link>
          <div className="text-sm text-gray-500 mb-2">in r/{post.subforum.subforum}</div>
          <p className="line-clamp-3">{post.content}</p>
          <div className="text-xs text-gray-400 mt-2">{new Date(post.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
);
}
