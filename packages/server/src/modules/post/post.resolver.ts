import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { PostService } from './post.service';
import { CreatePostInput } from './dto/create_post.input';
import { CreateCommentInput } from './dto/create_comment.input';
import { Post } from './dto/post.model';
import { Comment } from './dto/comment.model';

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Mutation(() => Post)
  async createPost(
    @Context('userId') userId: string,
    @Args('data') data: CreatePostInput,
  ) {
    if (!userId) throw new Error('Unauthorized');
    return this.postService.createPost(userId, data);
  }

  @Query(() => [Post])
  async posts() {
    const posts = await this.postService.getAllPosts();
    return posts.map((p) => ({
      ...p,
      likesCount: p.likes.length,
    }));
  }

  @Query(() => Post, { nullable: true })
  async post(@Args('id') id: string, @Context('userId') userId: string) {
    if (!userId) throw new Error('Unauthorized');
    const p = await this.postService.getPostById(id);
    if (!p) return null;
    const base = { ...p, likesCount: p.likes.length } as any; //TODO: Fix any type
    if (userId && userId === p.authorId)
      base.likers = p.likes.map((l) => l.user);
    else base.likers = null;
    return base;
  }

  @Mutation(() => Comment)
  async addComment(
    @Context('userId') userId: string,
    @Args('data') data: CreateCommentInput,
  ) {
    if (!userId) throw new Error('Unauthorized');
    return this.postService.addComment(userId, data.postId, data.content);
  }

  @Mutation(() => Boolean)
  async deleteComment(
    @Context('userId') userId: string,
    @Args('commentId') commentId: string,
  ) {
    if (!userId) throw new Error('Unauthorized');
    return this.postService.deleteComment(userId, commentId);
  }

  @Mutation(() => Boolean)
  async toggleLike(
    @Context('userId') userId: string,
    @Args('postId') postId: string,
  ) {
    const post = await this.postService.getPostById(postId);
    if (!userId || !post?.authorId) throw new Error('Unauthorized');
    const res = await this.postService.toggleLike(
      userId,
      postId,
      post?.authorId,
    );
    return res.liked;
  }

  @Mutation(() => Post)
  async toggleComments(
    @Context('userId') userId: string,
    @Args('postId') postId: string,
    @Args('allow') allow: boolean,
  ) {
    if (!userId) throw new Error('Unauthorized');
    return this.postService.toggleComments(postId, userId, allow);
  }
}
