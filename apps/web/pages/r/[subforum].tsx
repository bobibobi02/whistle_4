// pages/r/[subforum].tsx
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { VoteButtons } from '@/components/VoteButtons';
import SaveButton from '@/components/SaveButton'; //  FIXED
import { prisma } from '@/lib/prisma';

type PostWithExtras = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  voteCount: number;
  commentCount: number;
  userEmail: string;
  subforumName?: string | null;
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const raw = Array.isArray(params?.subforum) ? params.subforum[0] : params?.subforum ?? '';
  const subforumName = raw.trim();
  if (!subforumName) return { notFound: true };

  const postsRaw = await prisma.post.findMany({
    where: { subforum: { name: subforumName } },
    include: { user: true, votes: true, comments: true, subforum: true },
    orderBy: { createdAt: 'desc' },
  });

  const posts: PostWithExtras[] = postsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    content: (p.content ?? ''),
    createdAt: p.createdAt.toISOString(),
    voteCount: p.votes.reduce((s, v) => s + v.value, 0),
    commentCount: p.comments.length,
    userEmail: p.user.email,
    subforumName: (p.subforum?.name ?? null),
  }));

  return { props: { subforumName, posts } };
};

export default function SubforumPage({
  subforumName,
  posts,
}: {
  subforumName?: string | null;
  posts: PostWithExtras[];
}) {
  return (
    <>
      <Head>
        <title>Whistle  r/{subforumName}</title>
      </Head>
      <div className="container">
        <h1>r/{subforumName}</h1>

        {posts.length === 0 ? (
          <p className="empty">No posts yet.</p>
        ) : (
          <ul className="list">
            {posts.map((post) => (
              <li key={post.id} className="item">
                <div className="left">
                  <VoteButtons postId={post.id} initialVotes={post.voteCount} />
                </div>
                <div className="right">
                  <Link href={`/post/${post.id}`}>
                    <a className="link">{post.title}</a>
                  </Link>
                  <div className="meta">
                    Posted by u/{post.userEmail.split('@')[0]} on{' '}
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                  <p className="content">
                    {post.content.length > 100
                      ? `${post.content.slice(0, 100)}`
                      : post.content}
                  </p>
                  <div className="footer">
                    <span>{post.commentCount} comments</span>
                    <SaveButton postId={post.id} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .empty {
          color: #ff8c00; /* enjoyment-orange */
        }
        .list {
          list-style: none;
          padding: 0;
        }
        .item {
          display: flex;
          background: #ffffff;
          border: 2px solid #20c997; /* enjoyment-teal */
          border-radius: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .left {
          margin-right: 1rem;
        }
        .right {
          flex: 1;
        }
        .link {
          color: #20c997; /* enjoyment-teal */
          font-weight: 600;
          text-decoration: none;
          font-size: 1.125rem;
        }
        .link:hover {
          text-decoration: underline;
        }
        .meta {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #ff8c00; /* enjoyment-orange */
        }
        .content {
          margin: 0.75rem 0;
          color: #2e2e2e; /* neutral-dark */
          line-height: 1.5;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
}
