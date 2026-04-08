export class TaskDto {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string,
    readonly done: boolean,
    readonly createdAt: Date,
  ) {}
}

export class CreateTaskDto {
  constructor(
    readonly title: string,
    readonly description: string,
  ) {}
}
