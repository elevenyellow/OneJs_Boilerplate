import type { PrismaClient } from '@prisma/client'

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
    where: Parameters<PrismaClient[TModel]['findFirst']>[0]['where']
    select?: Parameters<PrismaClient[TModel]['findFirst']>[0]['select']
    include?: Parameters<PrismaClient[TModel]['findFirst']>[0]['include']
  }) {
    const { where, select, include } = args
    return this.model.findFirst({ where, select, include })
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
    where?: Parameters<PrismaClient[TModel]['findMany']>[0]['where']
    limit?: number
    skip?: number
    orderBy?: Parameters<PrismaClient[TModel]['findMany']>[0]['orderBy']
    select?: Parameters<PrismaClient[TModel]['findMany']>[0]['select']
    include?: Parameters<PrismaClient[TModel]['findMany']>[0]['include']
  }): Promise<{ data: any[]; total: number }> {
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
      }),
      this.model.count({ where }),
    ])

    return { data, total }
  }
}
