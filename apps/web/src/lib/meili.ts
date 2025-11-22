import { MeiliSearch } from 'meilisearch';

export const meili = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILI_API_KEY || '',
});

export async function indexPost(post) {
  const index = meili.index('posts');
  await index.addDocuments([post]);
}

export async function searchPosts(query, filters, limit = 20) {
  const index = meili.index('posts');
  return index.search(query, {
    filter: filters,
    limit,
  });
}
