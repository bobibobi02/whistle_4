import { useEffect, useState } from 'react';
import Link from 'next/link';

type Post = {
  id: string;
  title: string;
};

export default function RelatedPosts({ postId }: { postId: string }) {
  const [related, setRelated] = useState<Post[]>([]);

  useEffect(() => {
    fetch(`/api/posts/related?postId=${postId}`)
      .then(res => res.json())
      .then(setRelated);
  }, [postId]);

  if (!related.length) return null;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded">
      <h2 className="text-lg font-semibold mb-2">Related Posts</h2>
      <ul className="list-disc list-inside">
        {related.map(post => (
          <li key={post.id}>
            <Link href={`/post/${post.id}`}>
              <a className="text-blue-600 hover:underline">{post.title}</a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
