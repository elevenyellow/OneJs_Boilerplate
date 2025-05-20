import { EyJsError } from '@EyJs'

export class CreatePostDto {
  constructor(
    public title: string,
    public content: string,
    public userId: string,
    public createdAt?: Date,
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.title) {
      throw new EyJsError('Title is required', 400, 'Title is required')
    }

    if (this.title.length < 3) {
      throw new EyJsError(
        'Title must be at least 3 characters long',
        400,
        'Title must be at least 3 characters long',
      )
    }

    if (!this.content) {
      throw new EyJsError('Content is required', 400, 'Content is required')
    }

    if (this.content.length < 10) {
      throw new EyJsError(
        'Content must be at least 10 characters long',
        400,
        'Content must be at least 10 characters long',
      )
    }

    if (!this.userId) {
      throw new EyJsError('User ID is required', 400, 'User ID is required')
    }
  }

  static create(title: string, content: string, userId: string): CreatePostDto {
    return new CreatePostDto(title, content, userId, new Date())
  }
}
