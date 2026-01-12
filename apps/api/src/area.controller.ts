import { GetAreaDetailUseCase } from '@area/application/use-cases/get-area-detail.use-case'
import { Inject } from '@OneJs/core'
import { Controller, Get, type Context } from '@OneJs/server'

@Controller('/areas')
export class AreaController {
  constructor(
    @Inject(GetAreaDetailUseCase)
    private readonly getAreaDetailUseCase: GetAreaDetailUseCase,
  ) {}

  /**
   * GET /areas/:id
   * Get detailed area information with sectors
   */
  @Get('/:id')
  async getAreaDetail(context: Context) {
    const { id } = context.params as { id: string }
    const area = await this.getAreaDetailUseCase.execute(id)

    return area
  }
}
