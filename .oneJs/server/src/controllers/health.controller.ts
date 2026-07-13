import { Injectable } from '@OneJs/core'
import { Controller, Get } from '@OneJs/server'
import type { Context } from 'elysia'

@Injectable()
@Controller('/health')
export class HealthController {
  @Get('/')
  async check(_ctx: Context) {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    }
  }

  @Get('/ready')
  async ready(_ctx: Context) {
    // TODO: Add checks for database, Redis, etc.
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('/live')
  async live(_ctx: Context) {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    }
  }
}
