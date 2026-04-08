import { Route } from '../utils/route'

export const Patch = (path: string, version?: string) =>
  Route('patch', path, version)

export const Delete = (path: string, version?: string) =>
  Route('delete', path, version)

export const Post = (path: string, version?: string) =>
  Route('post', path, version)

export const Put = (path: string, version?: string) =>
  Route('put', path, version)

export const Get = (path: string, version?: string) =>
  Route('get', path, version)
