import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { AuthMiddleware } from '../auth.middleware'
import { OneJsError } from '../../errors'
import { ErrorCodes } from '../../errors'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAuthUser(role = 'user') {
  return { userId: 'user-1', email: 'user@example.com', role, payload: {} }
}

function makeStrategy(resolveWith?: any, rejectWith?: Error) {
  return {
    validate: mock(async (_token: string) => {
      if (rejectWith) throw rejectWith
      return resolveWith ?? makeAuthUser()
    }),
  }
}

function makeConfig(authProvider = 'local') {
  return {
    get: mock((key: string) =>
      key === 'AUTH_PROVIDER' ? authProvider : undefined,
    ),
  }
}

function makeLogger() {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  }
}

function makeMiddleware(
  authProvider = 'local',
  strategyOverride?: { validate: any },
) {
  const localStrategy = strategyOverride ?? makeStrategy()
  const clerkStrategy = makeStrategy()
  const configService = makeConfig(authProvider)
  const logger = makeLogger()
  return {
    middleware: new AuthMiddleware(
      configService as any,
      localStrategy as any,
      clerkStrategy as any,
      logger as any,
    ),
    localStrategy,
    clerkStrategy,
    configService,
    logger,
  }
}

function makeContext(authHeader?: string, storeOverride?: any) {
  return {
    request: {
      headers: {
        get: mock((key: string) =>
          key === 'authorization' ? authHeader : null,
        ),
      },
    },
    set: { status: 200 },
    store: storeOverride ?? {},
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthMiddleware', () => {
  describe('strategy selection', () => {
    test('uses local strategy when AUTH_PROVIDER is "local"', async () => {
      const localStrategy = makeStrategy()
      const { middleware } = makeMiddleware('local', localStrategy)
      const context = makeContext('Bearer valid-token')

      await middleware.handle(context as any)

      expect(localStrategy.validate).toHaveBeenCalledWith('valid-token')
    })

    test('uses local strategy when AUTH_PROVIDER is not set', async () => {
      const localStrategy = makeStrategy()
      const config = { get: mock((_k: string) => undefined) }
      const logger = makeLogger()
      const mw = new AuthMiddleware(
        config as any,
        localStrategy as any,
        makeStrategy() as any,
        logger as any,
      )
      const context = makeContext('Bearer token')

      await mw.handle(context as any)

      expect(localStrategy.validate).toHaveBeenCalled()
    })

    test('uses clerk strategy when AUTH_PROVIDER is "clerk"', async () => {
      const clerkStrategy = makeStrategy()
      const config = makeConfig('clerk')
      const logger = makeLogger()
      const mw = new AuthMiddleware(
        config as any,
        makeStrategy() as any,
        clerkStrategy as any,
        logger as any,
      )
      const context = makeContext('Bearer clerk-token')

      await mw.handle(context as any)

      expect(clerkStrategy.validate).toHaveBeenCalledWith('clerk-token')
    })
  })

  describe('missing authorization header', () => {
    test('throws OneJsError 401 when no header is present', async () => {
      const { middleware } = makeMiddleware()
      const context = makeContext(undefined)

      await expect(middleware.handle(context as any)).rejects.toBeInstanceOf(
        OneJsError,
      )
    })

    test('sets status 401 when no header is present', async () => {
      const { middleware } = makeMiddleware()
      const context = makeContext(undefined)

      try {
        await middleware.handle(context as any)
      } catch {}

      expect(context.set.status).toBe(401)
    })

    test('throws when header does not start with Bearer', async () => {
      const { middleware } = makeMiddleware()
      const context = makeContext('Basic dXNlcjpwYXNz')

      await expect(middleware.handle(context as any)).rejects.toBeInstanceOf(
        OneJsError,
      )
    })
  })

  describe('successful authentication', () => {
    test('sets context.store.user on success', async () => {
      const user = makeAuthUser('admin')
      const { middleware } = makeMiddleware('local', makeStrategy(user))
      const context = makeContext('Bearer valid-token')

      await middleware.handle(context as any)

      expect(context.store.user).toEqual(user)
    })

    test('strips Bearer prefix before passing token to strategy', async () => {
      const localStrategy = makeStrategy()
      const { middleware } = makeMiddleware('local', localStrategy)
      const context = makeContext('Bearer my-jwt-token')

      await middleware.handle(context as any)

      expect(localStrategy.validate).toHaveBeenCalledWith('my-jwt-token')
    })
  })

  describe('role checking', () => {
    test('allows access when user has the required role', async () => {
      const user = makeAuthUser('admin')
      const { middleware } = makeMiddleware('local', makeStrategy(user))
      const context = makeContext('Bearer token')

      await expect(
        middleware.handle(context as any, ['admin']),
      ).resolves.toBeUndefined()
    })

    test('throws 403 when user does not have the required role', async () => {
      const user = makeAuthUser('user')
      const { middleware } = makeMiddleware('local', makeStrategy(user))
      const context = makeContext('Bearer token')

      let thrown: any
      try {
        await middleware.handle(context as any, ['admin'])
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBeInstanceOf(OneJsError)
      expect(context.set.status).toBe(403)
    })

    test('does not check roles when requiredRoles is empty', async () => {
      const user = makeAuthUser('user')
      const { middleware } = makeMiddleware('local', makeStrategy(user))
      const context = makeContext('Bearer token')

      await expect(
        middleware.handle(context as any, []),
      ).resolves.toBeUndefined()
    })

    test('does not check roles when requiredRoles is not provided', async () => {
      const user = makeAuthUser('user')
      const { middleware } = makeMiddleware('local', makeStrategy(user))
      const context = makeContext('Bearer token')

      await expect(middleware.handle(context as any)).resolves.toBeUndefined()
    })
  })

  describe('invalid token', () => {
    test('throws OneJsError 401 when strategy throws a generic error', async () => {
      const { middleware } = makeMiddleware(
        'local',
        makeStrategy(undefined, new Error('jwt expired')),
      )
      const context = makeContext('Bearer expired-token')

      let thrown: any
      try {
        await middleware.handle(context as any)
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBeInstanceOf(OneJsError)
      expect(context.set.status).toBe(401)
    })

    test('rethrows OneJsError directly without wrapping', async () => {
      const originalError = new OneJsError(
        'Forbidden',
        403,
        'no access',
        undefined,
        ErrorCodes.PERMISSION_DENIED as any,
      )
      const { middleware } = makeMiddleware(
        'local',
        makeStrategy(undefined, originalError),
      )
      const context = makeContext('Bearer token')

      let thrown: any
      try {
        await middleware.handle(context as any)
      } catch (e) {
        thrown = e
      }

      expect(thrown).toBe(originalError)
    })
  })
})
