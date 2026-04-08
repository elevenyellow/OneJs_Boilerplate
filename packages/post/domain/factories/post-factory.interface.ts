import { PostEntity } from '../entities/post'
import { CreatePostDto } from '../dtos/create-post.dto'

export interface PostFactory {
  createPost(dto: CreatePostDto): Promise<PostEntity>
  createPostFromExisting(post: Partial<PostEntity>): PostEntity
}
