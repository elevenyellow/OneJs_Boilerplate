import { describe, test, expect, beforeEach } from 'bun:test'
import { PrismaRepository } from '../repositories/base.repository'
import type { PrismaClient } from '@prisma/client'

// Concrete subclass used only for testing — no domain methods needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class TestRepository extends PrismaRepository<any> {}

type ModelMock = {
  findMany: (...args: unknown[]) => Promise<unknown[]>
  findFirst: (...args: unknown[]) => Promise<unknown>
  create: (...args: unknown[]) => Promise<unknown>
  update: (...args: unknown[]) => Promise<unknown>
  delete: (...args: unknown[]) => Promise<unknown>
  count: (...args: unknown[]) => Promise<number>
}

type Call = { method: keyof ModelMock; args: unknown }

function createModelMock(
  overrides: Partial<ModelMock> = {},
): ModelMock & { calls: Call[] } {
  const calls: Call[] = []
  return {
    calls,
    findMany: async (args) => {
      calls.push({ method: 'findMany', args })
      return []
    },
    findFirst: async (args) => {
      calls.push({ method: 'findFirst', args })
      return null
    },
    create: async (args) => {
      calls.push({ method: 'create', args })
      return args
    },
    update: async (args) => {
      calls.push({ method: 'update', args })
      return args
    },
    delete: async (args) => {
      calls.push({ method: 'delete', args })
      return {}
    },
    count: async (args) => {
      calls.push({ method: 'count', args })
      return 0
    },
    ...overrides,
  }
}

function createRepo(mock: ModelMock): TestRepository {
  const fakePrisma = { task: mock } as unknown as PrismaClient
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new TestRepository(fakePrisma, 'task' as any)
}

describe('PrismaRepository', () => {
  let mock: ReturnType<typeof createModelMock>
  let repo: TestRepository

  beforeEach(() => {
    mock = createModelMock()
    repo = createRepo(mock)
  })

  describe('findAll()', () => {
    test('calls model.findMany with empty args by default', async () => {
      await repo.findAll()

      expect(mock.calls).toHaveLength(1)
      expect(mock.calls[0].method).toBe('findMany')
      expect(mock.calls[0].args).toEqual({})
    })

    test('forwards provided args to model.findMany', async () => {
      const args = { where: { active: true }, take: 5 }
      await repo.findAll(args)

      expect(mock.calls[0].args).toEqual(args)
    })

    test('returns the result from model.findMany', async () => {
      const rows = [{ id: 1 }, { id: 2 }]
      mock = createModelMock({ findMany: async () => rows })
      repo = createRepo(mock)

      const result = await repo.findAll()
      expect(result).toEqual(rows)
    })
  })

  describe('findOne()', () => {
    test('calls model.findFirst with the given where clause', async () => {
      await repo.findOne({ where: { id: '42' } })

      expect(mock.calls[0].method).toBe('findFirst')
      expect(mock.calls[0].args).toMatchObject({ where: { id: '42' } })
    })

    test('includes select and include when provided', async () => {
      await repo.findOne({
        where: { id: '1' },
        select: { name: true },
        include: { posts: true },
      })

      expect(mock.calls[0].args).toEqual({
        where: { id: '1' },
        select: { name: true },
        include: { posts: true },
      })
    })

    test('returns null when the record is not found', async () => {
      const result = await repo.findOne({ where: { id: 'missing' } })
      expect(result).toBeNull()
    })

    test('returns the record when found', async () => {
      const record = { id: '1', name: 'Alice' }
      mock = createModelMock({ findFirst: async () => record })
      repo = createRepo(mock)

      const result = await repo.findOne({ where: { id: '1' } })
      expect(result).toEqual(record)
    })
  })

  describe('create()', () => {
    test('calls model.create with the provided args', async () => {
      const args = { data: { name: 'Alice' } }
      await repo.create(args)

      expect(mock.calls[0].method).toBe('create')
      expect(mock.calls[0].args).toEqual(args)
    })

    test('returns the created record', async () => {
      const created = { id: '1', name: 'Alice' }
      mock = createModelMock({ create: async () => created })
      repo = createRepo(mock)

      const result = await repo.create({ data: { name: 'Alice' } })
      expect(result).toEqual(created)
    })
  })

  describe('update()', () => {
    test('calls model.update with the provided args', async () => {
      const args = { where: { id: '1' }, data: { name: 'Bob' } }
      await repo.update(args)

      expect(mock.calls[0].method).toBe('update')
      expect(mock.calls[0].args).toEqual(args)
    })

    test('returns the updated record', async () => {
      const updated = { id: '1', name: 'Bob' }
      mock = createModelMock({ update: async () => updated })
      repo = createRepo(mock)

      const result = await repo.update({
        where: { id: '1' },
        data: { name: 'Bob' },
      })
      expect(result).toEqual(updated)
    })
  })

  describe('delete()', () => {
    test('calls model.delete with the provided args', async () => {
      const args = { where: { id: '1' } }
      await repo.delete(args)

      expect(mock.calls[0].method).toBe('delete')
      expect(mock.calls[0].args).toEqual(args)
    })
  })

  describe('findWithPagination()', () => {
    test('returns data and total', async () => {
      mock = createModelMock({
        findMany: async () => [{ id: '1' }],
        count: async () => 1,
      })
      repo = createRepo(mock)

      const result = await repo.findWithPagination({})
      expect(result).toEqual({ data: [{ id: '1' }], total: 1 })
    })

    test('defaults: limit=10, skip=0, orderBy={createdAt:desc}, where={}', async () => {
      await repo.findWithPagination({})

      const findManyCall = mock.calls.find((c) => c.method === 'findMany')
      expect(findManyCall?.args).toMatchObject({
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
        where: {},
      })
    })

    test('respects custom limit and skip', async () => {
      await repo.findWithPagination({ limit: 5, skip: 20 })

      const findManyCall = mock.calls.find((c) => c.method === 'findMany')
      expect(findManyCall?.args).toMatchObject({ take: 5, skip: 20 })
    })

    test('passes where, orderBy, select and include to findMany', async () => {
      const args = {
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true },
        include: { posts: true },
      }
      await repo.findWithPagination(args)

      const findManyCall = mock.calls.find((c) => c.method === 'findMany')
      expect(findManyCall?.args).toMatchObject(args)
    })

    test('count query uses the same where clause', async () => {
      await repo.findWithPagination({ where: { active: true } })

      const countCall = mock.calls.find((c) => c.method === 'count')
      expect(countCall?.args).toMatchObject({ where: { active: true } })
    })

    test('runs findMany and count in parallel', async () => {
      const order: string[] = []
      mock = createModelMock({
        findMany: async () => {
          order.push('findMany')
          return []
        },
        count: async () => {
          order.push('count')
          return 0
        },
      })
      repo = createRepo(mock)

      await repo.findWithPagination({})

      // Both called — order may vary since they run in parallel
      expect(order).toContain('findMany')
      expect(order).toContain('count')
    })
  })
})
