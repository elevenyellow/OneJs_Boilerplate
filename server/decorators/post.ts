import { Route } from '../utils/route'

export const Post = (path: string, version?: string) =>
  Route('post', path, version)
