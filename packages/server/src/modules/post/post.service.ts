import { Injectable } from '@nestjs/common';
import { prisma } from 'src/lib/prismaClient';

@Injectable()
export class PostService {
  async createPost(
    authorId: string,
    data: { content: string; imageUrl?: string; allowComments?: boolean },
  ) {
    return prisma.post.create({
      data: {
        authorId,
        content: data.content,
        imageUrl: data.imageUrl,
        allowComments: data.allowComments ?? true,
      },
      include: { author: true },
    });
  }

  async getPostById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        comments: { include: { author: true } },
        likes: { include: { user: true } },
      },
    });
  }

  async getAllPosts() {
    return prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        comments: { include: { author: true } },
        likes: { include: { user: true } },
      },
    });
  }

  async addComment(authorId: string, postId: string, content: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (!post.allowComments)
      throw new Error('Comments are disabled for this post');

    return prisma.comment.create({
      data: { postId, authorId, content },
      include: { author: true },
    });
  }

  async deleteComment(requesterId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });
    if (!comment) throw new Error('Comment not found');
    if (comment.post.authorId !== requesterId) throw new Error('Not allowed');
    await prisma.comment.delete({ where: { id: commentId } });
    return true;
  }

  async toggleLike(userId: string, postId: string) {
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await prisma.like.create({ data: { postId, userId } });
    return { liked: true };
  }

  async toggleComments(postId: string, requesterId: string, allow: boolean) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== requesterId) throw new Error('Not allowed');
    return prisma.post.update({
      where: { id: postId },
      data: { allowComments: allow },
    });
  }
}
