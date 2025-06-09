import type { ClassConstructor } from '@EyJs'
import { registerWorkerHandler } from '../store'

export function WorkerJob(queueName: string, concurrency = 1): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const controller = target.constructor as ClassConstructor

    registerWorkerHandler({
      target: controller,
      methodName: propertyKey as string,
      queueName,
      concurrency,
    })

    return descriptor
  }
}
