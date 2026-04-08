import type { ClassConstructor } from '@OneJs/core'

// worker-metadata-registry.ts
interface WorkerMetadata {
  target: ClassConstructor
  methodName: string
  queueName: string
  concurrency: number
}

const workerHandlers: WorkerMetadata[] = []

export function registerWorkerHandler(meta: WorkerMetadata) {
  workerHandlers.push(meta)
}

export function getAllWorkerHandlers(): WorkerMetadata[] {
  return workerHandlers
}
