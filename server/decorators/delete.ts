import { Route } from '../utils/route'

export const Delete = (path: string, version?: string) =>
  Route('delete', path, version)
