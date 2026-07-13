import type { Container } from '@OneJs/core'
import { describe, expect, test } from 'bun:test'
import { PrismaPlugin } from '../prisma-plugin'
import { PrismaClientOneJs } from '../services/prisma-client'

type RegisterCall = { cls: unknown; opts: unknown }

function makeContainer(prismaInstance: { $connect: () => Promise<void> }) {
  const registerCalls: RegisterCall[] = []
  return {
    container: {
      registerClass: (cls: unknown, opts: unknown) => {
        registerCalls.push({ cls, opts })
      },
      get: () => prismaInstance,
    } as unknown as Container,
    registerCalls,
  }
}

describe('PrismaPlugin', () => {
  describe('metadata', () => {
    test('name is "prisma-plugin"', () => {
      expect(new PrismaPlugin().name).toBe('prisma-plugin')
    })

    test('priority is 50', () => {
      expect(new PrismaPlugin().priority).toBe(50)
    })

    test('depends on "bootstrap-loader"', () => {
      expect(new PrismaPlugin().dependsOn).toContain('bootstrap-loader')
    })

    test('is critical', () => {
      expect(new PrismaPlugin().critical).toBe(true)
    })
  })

  describe('register()', () => {
    test('registers PrismaClientOneJs as singleton', async () => {
      const { container, registerCalls } = makeContainer({
        $connect: async () => {},
      })

      await new PrismaPlugin().register(container)

      expect(registerCalls).toHaveLength(1)
      expect(registerCalls[0].cls).toBe(PrismaClientOneJs)
      expect(registerCalls[0].opts).toEqual({ scope: 'singleton' })
    })
  })

  describe('load()', () => {
    test('calls $connect on the prisma instance', async () => {
      let connected = false
      const { container } = makeContainer({
        $connect: async () => {
          connected = true
        },
      })

      await new PrismaPlugin().load(container)

      expect(connected).toBe(true)
    })

    test('rethrows when $connect fails', async () => {
      const { container } = makeContainer({
        $connect: async () => {
          throw new Error('DB unreachable')
        },
      })

      await expect(new PrismaPlugin().load(container)).rejects.toThrow(
        'DB unreachable',
      )
    })
  })
})
