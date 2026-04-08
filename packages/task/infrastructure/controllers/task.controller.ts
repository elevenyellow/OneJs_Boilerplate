import { ErrorCodes, Inject, OneJsError, Roles, UseAuth } from '@OneJs/core'
import { Controller, Delete, Get, Patch, Post } from '@OneJs/server'
import { AppRoles } from '@shared/auth'
import type { Context } from 'elysia'
import { CreateTaskDto } from '../../application/dtos/task.dto'
import { TaskService } from '../../application/task.service'

@Controller('/tasks')
export class TaskController {
  constructor(@Inject(TaskService) private readonly taskService: TaskService) {}

  // ── Public ──────────────────────────────────────────────
  @Get('/')
  async getAll(_ctx: Context) {
    const tasks = await this.taskService.getAll()
    return tasks.map((t) => t.toDto())
  }

  // ── Authenticated (user | staff | admin) ───────────────
  @Get('/:id')
  @UseAuth()
  async getById(ctx: Context) {
    const task = await this.taskService.getById(ctx.params.id)
    if (!task)
      throw new OneJsError(
        'Not Found',
        404,
        'Task not found',
        {},
        ErrorCodes.RESOURCE_NOT_FOUND,
      )
    return task.toDto()
  }

  @Post('/')
  @UseAuth()
  async create(ctx: Context) {
    const body = ctx.body as Partial<CreateTaskDto>
    if (!body?.title)
      throw new OneJsError(
        'Validation failed',
        400,
        'title is required',
        {},
        ErrorCodes.VALIDATION_FAILED,
      )

    const dto = new CreateTaskDto(body.title, body.description ?? '')
    const task = await this.taskService.create(dto.title, dto.description)

    ctx.set.status = 201
    return task.toDto()
  }

  // ── Staff + Admin only ─────────────────────────────────
  @Patch('/:id/complete')
  @UseAuth()
  @Roles(AppRoles.STAFF, AppRoles.ADMIN)
  async complete(ctx: Context) {
    const task = await this.taskService.complete(ctx.params.id)
    return task.toDto()
  }

  // ── Admin only ─────────────────────────────────────────
  @Delete('/:id')
  @UseAuth()
  @Roles(AppRoles.ADMIN)
  async delete(ctx: Context) {
    await this.taskService.delete(ctx.params.id)
    ctx.set.status = 204
  }
}
