/**
 * DTO for user ascent statistics
 */
export interface UserStatsDto {
  totalAscents: number
  byGradeBand: Record<string, number>
  byStyle: Record<string, number>
}
