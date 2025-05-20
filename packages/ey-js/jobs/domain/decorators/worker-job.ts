import 'reflect-metadata'
import { container, type ClassConstructor } from '@EyJs'
import { WorkerService } from '../../application/worker.service'

export function WorkerJob(queueName: string, concurrency = 1): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const classConstructor = target.constructor

    // Diferir el registro hasta que la app esté lista
    const instance = container.resolve(
      classConstructor as ClassConstructor<any>,
    )
    const workerService = container.resolve<WorkerService>(WorkerService)

    const processor = descriptor.value.bind(instance)

    workerService.registerWorker(queueName, processor, concurrency)

    console.log(
      `🚀 Worker registered for "${queueName}" from method "${String(propertyKey)}"`,
    )
  }
}
