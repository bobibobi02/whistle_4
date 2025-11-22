// prisma/seed.js
/* Seed your dev DB with demo subforums, posts, votes, and comments.
   Run:  node prisma/seed.js
*/
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AUTHORS = ['seed1@local', 'seed2@local', 'seed3@local', 'seed4@local'];
const VOTERS  = ['seed1@local', 'seed2@local', 'seed3@local', 'seed4@local', 'seed5@local', 'seed6@local'];
const SUBS    = ['General', 'Showcase', 'News'];
const LIPSUM  = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.';

function ago(ms) { return new Date(Date.now() - ms); }

async function main() {
  console.log('рџЊ± Seeding dev databaseвЂ¦');

  // Ensure subforums exist
  for (const name of SUBS) {
    await prisma.subforum.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} topics` },
    });
  }

  // Create sample posts
  const posts = [];
  for (let i = 0; i < 18; i++) {
    const author = AUTHORS[i % AUTHORS.length];
    const subforumName = SUBS[i % SUBS.length];
    const createdAt = ago((i + 1) * 60 * 60 * 1000);

    const post = await prisma.post.create({
      data: {
        title: `Sample Post #${i + 1} in ${subforumName}`,
        content: `${LIPSUM}\n\n(Seeded item ${i + 1})`,
        mediaUrl: i % 3 === 0 ? `https://picsum.photos/seed/whistle${i + 1}/960/540` : null,
        subforumName,
        userEmail: author,
        createdAt,
      },
    });
    posts.push(post);
  }
  console.log(`рџ“ќ Created ${posts.length} posts.`);

  // Votes: make varied scores
  let voteCount = 0;
  for (const post of posts) {
    for (const voter of VOTERS) {
      const idx = parseInt(post.id.slice(-2), 36) % 10;
      const upBias = (post.createdAt.getTime() % 5) + idx;
      const value = upBias % 3 === 0 ? -1 : 1; // mostly upvotes, some down
      await prisma.vote.upsert({
        where: { postId_userEmail: { postId: post.id, userEmail: voter } },
        update: { value },
        create: { postId: post.id, userEmail: voter, value },
      });
      voteCount++;
    }
  }
  console.log(`вќ¤пёЏ Cast ${voteCount} votes.`);

  // Comments: a couple per first N posts
  let commentCount = 0;
  for (let i = 0; i < Math.min(posts.length, 8); i++) {
    const p = posts[i];
    const c1 = await prisma.comment.create({
      data: {
        postId: p.id,
        content: `First comment on "${p.title}"`,
        userEmail: AUTHORS[i % AUTHORS.length],
        createdAt: ago(1000 * 60 * (i + 1)),
      },
    });
    commentCount++;

    await prisma.comment.create({
      data: {
        postId: p.id,
        parentId: c1.id,
        content: `Reply to the first comment (${i + 1})`,
        userEmail: AUTHORS[(i + 1) % AUTHORS.length],
        createdAt: ago(1000 * 60 * (i + 1) - 30 * 1000),
      },
    });
    commentCount++;
  }
  console.log(`рџ’¬ Created ${commentCount} comments.`);

  console.log('вњ… Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });