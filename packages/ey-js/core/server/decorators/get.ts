import { Route } from '../utils/route'

export const Get = (path: string, version?: string) =>
  Route('get', path, version)
