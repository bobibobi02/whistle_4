import { useEffect } from 'react';
import { indexPost } from '../lib/meili';

type MeiliPost = any;


export default function MeiliInitializer({ post }: { post: MeiliPost }) {
  useEffect(() => {
    if (post) {
      indexPost({
        id: post.id,
        title: post.title,
        content: post.content,
        userEmail: post.userEmail,
        subforum: post.subforumName,
        createdAt: post.createdAt,
      });
    }
  }, [post]);

  return null;
}
