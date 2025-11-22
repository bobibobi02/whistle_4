import { useRouter } from 'next/router';
import useSWR from 'swr';
import Link from 'next/link';
import Head from 'next/head';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;

  const { data, error, isLoading } = useSWR(
    typeof q === 'string' ? `/api/search?q=${encodeURIComponent(q)}` : null,
    fetcher
  );

  return (
    <>
      <Head><title>Search  Whistle</title></Head>
      <div className="container">
        <h1 className="heading">Search Results for {q}</h1>

        {isLoading && <p>Loading</p>}
        {error && <p className="error">Failed to load results</p>}

        {!isLoading && data && (
          <>
            <h2 className="section-title">Posts</h2>
            {data.posts.length === 0 ? (
              <p>No matching posts found.</p>
            ) : (
              data.posts.map(post => (
                <div key={post.id} className="result-card">
                  <Link href={`/post/${post.id}`} passHref legacyBehavior>
                    <a className="post-title">{post.title}</a>
                  </Link>
                  <p className="post-meta">
                    by u/{post.user.email.split('@')[0]} in{' '}
                    <Link href={`/r/${post.subforum.subforum}`} passHref legacyBehavior>
                      <a className="subforum-link">r/{post.subforum.subforum}</a>
                    </Link>
                  </p>
                </div>
              ))
            )}

            <h2 className="section-title">Subforums</h2>
            {data.subforums.length === 0 ? (
              <p>No subforums found.</p>
            ) : (
              data.subforums.map(sub => (
                <Link
                  key={sub.id}
                  href={`/r/${sub.subforum}`}
                  passHref
                  legacyBehavior
                >
                  <a className="subforum-tag">r/{sub.subforum}</a>
                </Link>
              ))
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .heading {
          font-size: 1.75rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 1.25rem;
          margin-top: 2rem;
          color: #20C997;
        }
        .error {
          color: #FF4FAA;
        }
        .result-card {
          background: #FFF;
          border: 2px solid #20C997;
          border-radius: 1rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .post-title {
          font-weight: 600;
          font-size: 1.1rem;
          color: #0070f3;
          text-decoration: none;
        }
        .post-title:hover {
          color: #FF4FAA;
        }
        .post-meta {
          font-size: 0.85rem;
          color: #555;
          margin-top: 0.25rem;
        }
        .subforum-link {
          color: #20C997;
          text-decoration: none;
        }
        .subforum-link:hover {
          color: #FF4FAA;
        }
        .subforum-tag {
          display: inline-block;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
          padding: 0.4rem 0.75rem;
          border: 1px solid #20C997;
          border-radius: 9999px;
          text-decoration: none;
          color: #0070f3;
          font-size: 0.9rem;
        }
        .subforum-tag:hover {
          background: #FFF5E1;
          color: #FF4FAA;
        }
      `}</style>
    </>
  );
}

