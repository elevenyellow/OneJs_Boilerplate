/**
 * Auth integration tests — Server + AuthMiddleware + LocalJwtStrategy
 *
 * Tests the real auth pipeline end-to-end:
 *   HTTP Request → Server beforeHandle → AuthMiddleware.handle()
 *   → LocalJwtStrategy.validate() → jwt.verify() → role check
 *
 * Uses Elysia's internal handle() so no real TCP server is needed.
 * Signs JWTs with 'default_secret' (LocalJwtStrategy fallback when JWT_SECRET is unset).
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import jwt from 'jsonwebtoken'
import {
  AuthMiddleware,
  Container,
  Logger,
  OneJs,
  PluginRegistry,
  metadataRegistry,
} from '@OneJs/core'
import { ServerPlugin } from '@OneJs/server'
import { Server } from '@OneJs/server/http-server'
import {
  clearControllers,
  registerController,
} from '@OneJs/server/controller-registry'

// ── Constants ────────────────────────────────────────────────────────────────

const JWT_SECRET = 'default_secret' // matches LocalJwtStrategy fallback

const stubBootstrapLoader = { name: 'bootstrap-loader', priority: 10 }

// ── Helpers ──────────────────────────────────────────────────────────────────

function signToken(payload: { sub: string; email?: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

function get(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new Request(`http://test${path}`, { headers })
}

/**
 * ServerPlugin.register() removes Server from metadataRegistry.
 * Restore it before each test so OneJs.start() can re-register it.
 */
function restoreServerMetadata() {
  metadataRegistry.registerService(Server, 'singleton', false)
  metadataRegistry.registerParamType(Server, 0, Logger)
}

// ── Test controller ──────────────────────────────────────────────────────────
//
// Uses manual __meta (no @Controller decorator) following the same pattern
// as plugins.e2e.test.ts, so we avoid polluting the global controller registry.

class AuthTestController {
  static __meta = {
    path: '/guarded',
    routes: {
      publicEndpoint: {
        method: 'get',
        path: '/public',
      },
      authEndpoint: {
        method: 'get',
        path: '/user',
        middlewares: [AuthMiddleware],
        roles: [],
      },
      adminEndpoint: {
        method: 'get',
        path: '/admin',
        middlewares: [AuthMiddleware],
        roles: ['admin'],
      },
      staffOrAdminEndpoint: {
        method: 'get',
        path: '/staff',
        middlewares: [AuthMiddleware],
        roles: ['staff', 'admin'],
      },
    },
  }

  publicEndpoint() {
    return { msg: 'public' }
  }

  authEndpoint(ctx: any) {
    return { role: ctx.store?.user?.role ?? 'unknown' }
  }

  adminEndpoint() {
    return { secret: 'admin-data' }
  }

  staffOrAdminEndpoint() {
    return { secret: 'staff-data' }
  }
}

// ── App factory ──────────────────────────────────────────────────────────────

async function bootAuthApp() {
  const container = new Container()

  registerController(AuthTestController)
  container.register(AuthTestController, 'transient', false, [])

  await new OneJs(container)
    .use(stubBootstrapLoader)
    .use(new ServerPlugin())
    .start()

  const server = container.get(Server)
  server.setContainer(container)

  ;(server as any).app.listen = (_port: number, cb?: () => void) => {
    cb?.()
    return (server as any).app
  }

  server.setPrefix('/api').start(0)

  return (server as any).app as { handle: (req: Request) => Promise<Response> }
}

// ═════════════════════════════════════════════════════════════════════════════

describe('Auth integration — Server + AuthMiddleware + LocalJwtStrategy', () => {
  let app: Awaited<ReturnType<typeof bootAuthApp>>

  beforeEach(async () => {
    clearControllers()
    PluginRegistry.clear()
    restoreServerMetadata()
    app = await bootAuthApp()
  })

  // ── Public route ─────────────────────────────────────────────────────────

  describe('GET /api/guarded/public (no middleware)', () => {
    it('returns 200 without any token', async () => {
      const res = await app.handle(get('/api/guarded/public'))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.msg).toBe('public')
    })
  })

  // ── Missing / malformed Authorization header ─────────────────────────────

  describe('GET /api/guarded/user — missing / malformed token', () => {
    it('returns 401 AUTH_MISSING when header is absent', async () => {
      const res = await app.handle(get('/api/guarded/user'))

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    it('returns 401 AUTH_MISSING when header is not Bearer scheme', async () => {
      const req = new Request('http://test/api/guarded/user', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      })
      const res = await app.handle(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_MISSING')
    })
  })

  // ── Invalid token ────────────────────────────────────────────────────────

  describe('GET /api/guarded/user — invalid token', () => {
    it('returns 401 AUTH_INVALID for a tampered token', async () => {
      const res = await app.handle(
        get('/api/guarded/user', 'garbage.token.here'),
      )

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_INVALID')
    })

    it('returns 401 AUTH_INVALID for a JWT signed with wrong secret', async () => {
      const badToken = jwt.sign({ sub: 'u1', role: 'user' }, 'wrong_secret')
      const res = await app.handle(get('/api/guarded/user', badToken))

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error.code).toBe('AUTH_INVALID')
    })

    it('returns 401 for an expired JWT', async () => {
      const expiredToken = jwt.sign({ sub: 'u1', role: 'user' }, JWT_SECRET, {
        expiresIn: '-1s',
      })
      const res = await app.handle(get('/api/guarded/user', expiredToken))

      expect(res.status).toBe(401)
    })
  })

  // ── Valid token — any authenticated user ─────────────────────────────────

  describe('GET /api/guarded/user — valid JWT', () => {
    it('returns 200 with user role in response', async () => {
      const token = signToken({ sub: 'u1', role: 'user' })
      const res = await app.handle(get('/api/guarded/user', token))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.role).toBe('user')
    })

    it('returns 200 for admin role on a no-role-restriction endpoint', async () => {
      const token = signToken({ sub: 'u2', role: 'admin' })
      const res = await app.handle(get('/api/guarded/user', token))

      expect(res.status).toBe(200)
    })
  })

  // ── Admin-only endpoint ──────────────────────────────────────────────────

  describe('GET /api/guarded/admin — roles: [admin]', () => {
    it('returns 403 PERMISSION_DENIED for user role', async () => {
      const token = signToken({ sub: 'u1', role: 'user' })
      const res = await app.handle(get('/api/guarded/admin', token))

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error.code).toBe('PERMISSION_DENIED')
    })

    it('returns 403 for staff role', async () => {
      const token = signToken({ sub: 'u1', role: 'staff' })
      const res = await app.handle(get('/api/guarded/admin', token))

      expect(res.status).toBe(403)
    })

    it('returns 200 for admin role', async () => {
      const token = signToken({ sub: 'u1', role: 'admin' })
      const res = await app.handle(get('/api/guarded/admin', token))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.secret).toBe('admin-data')
    })

    it('returns 401 without a token', async () => {
      const res = await app.handle(get('/api/guarded/admin'))

      expect(res.status).toBe(401)
    })
  })

  // ── Multi-role endpoint ──────────────────────────────────────────────────

  describe('GET /api/guarded/staff — roles: [staff, admin]', () => {
    it('returns 403 for user role', async () => {
      const token = signToken({ sub: 'u1', role: 'user' })
      const res = await app.handle(get('/api/guarded/staff', token))

      expect(res.status).toBe(403)
    })

    it('returns 200 for staff role', async () => {
      const token = signToken({ sub: 'u1', role: 'staff' })
      const res = await app.handle(get('/api/guarded/staff', token))

      expect(res.status).toBe(200)
    })

    it('returns 200 for admin role', async () => {
      const token = signToken({ sub: 'u1', role: 'admin' })
      const res = await app.handle(get('/api/guarded/staff', token))

      expect(res.status).toBe(200)
    })
  })
})
