import { prisma } from '../prisma'; // adjust import path as needed

export const resolvers = {
  Query: {
    posts: async () => {
      return prisma.post.findMany({ include: { user: true, subforum: true } });
    },
    post: async (_: any, args: { id: string }) => {
      return prisma.post.findUnique({ where: { id: args.id }, include: { user: true, subforum: true } });
    },
    users: async () => {
      return prisma.user.findMany();
    },
    user: async (_: any, args: { id: string }) => {
      return prisma.user.findUnique({ where: { id: args.id } });
    },
    subforums: async () => {
      return prisma.subforum.findMany();
    },
    subforum: async (_: any, args: { subforum: string }) => {
      return prisma.subforum.findUnique({ where: { subforum: args.subforum } });
    }
  },
  Mutation: {
    createPost: async (_: any, args: { subforumName: string; title: string; content: string }, context: any) => {
      // Example: use context for auth
      const sessionUser = context.req.session?.user; 
      if (!sessionUser) throw new Error('Not authenticated');
      return prisma.post.create({
        data: {
          title: args.title,
          content: args.content,
          subforumName: args.subforumName,
          userEmail: sessionUser.email
        },
        include: { user: true, subforum: true }
      });
    }
  },
  Post: {
    createdAt: (parent: any) => parent.createdAt.toISOString()
  },
  Comment: {
    createdAt: (parent: any) => parent.createdAt.toISOString()
  }
};
