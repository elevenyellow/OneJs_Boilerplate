import { Route } from '../utils/route'

export const Put = (path: string, version?: string) =>
  Route('put', path, version)
