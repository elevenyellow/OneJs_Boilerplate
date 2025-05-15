export class PostEntity {
  constructor(
    public title: string,
    public content: string,
    public userId: string,
    public id?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
