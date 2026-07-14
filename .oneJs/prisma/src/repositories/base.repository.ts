import type { PrismaClient } from '@prisma/client'

type QueryValue = Record<string, unknown>

export abstract class PrismaRepository<TModel extends keyof PrismaClient> {
  protected model: PrismaClient[TModel]

  constructor(
    protected prisma: PrismaClient,
    modelName: TModel,
  ) {
    this.model = prisma[modelName]
  }

  findAll(args: Parameters<PrismaClient[TModel]['findMany']>[0] = {}) {
    return this.model.findMany(args)
  }

  findOne(args: {
    where: QueryValue
    select?: QueryValue
    include?: QueryValue
  }) {
    const { where, select, include } = args
    return this.model.findFirst({
      where,
      select,
      include,
    } as Parameters<PrismaClient[TModel]['findFirst']>[0])
  }

  create(args: Parameters<PrismaClient[TModel]['create']>[0]) {
    return this.model.create(args)
  }

  update(args: Parameters<PrismaClient[TModel]['update']>[0]) {
    return this.model.update(args)
  }

  delete(args: Parameters<PrismaClient[TModel]['delete']>[0]) {
    return this.model.delete(args)
  }

  async findWithPagination(args: {
    where?: QueryValue
    limit?: number
    skip?: number
    orderBy?: QueryValue
    select?: QueryValue
    include?: QueryValue
  }): Promise<{ data: unknown[]; total: number }> {
    const {
      where = {},
      limit = 10,
      skip = 0,
      orderBy = { createdAt: 'desc' },
      select,
      include,
    } = args

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        take: limit,
        skip,
        orderBy,
        select,
        include,
      } as Parameters<PrismaClient[TModel]['findMany']>[0]),
      this.model.count({ where } as Parameters<
        PrismaClient[TModel]['count']
      >[0]),
    ])

    return { data, total }
  }
}
