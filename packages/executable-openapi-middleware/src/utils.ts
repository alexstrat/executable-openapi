import { HandlersMap } from 'executable-openapi-router'
import { HTTPRequestMethod, OperationHandler } from 'executable-openapi-types'

export function mapOperationHandlers<TExecutionContext> (
  handlers: HandlersMap<TExecutionContext>,
  mapFunction: (
    handler: OperationHandler<TExecutionContext>,
    info: { operationId: string } | { path: string, method: HTTPRequestMethod} | 'default'
  ) => OperationHandler<TExecutionContext> | undefined
): HandlersMap<TExecutionContext> {
  let newHandlers: HandlersMap<TExecutionContext> = {}

  if (handlers.operations !== undefined) {
    for (const [operationId, handler] of Object.entries(handlers.operations)) {
      const newHandler = mapFunction(handler, { operationId })
      if (newHandler !== undefined) {
        newHandlers = {
          ...newHandlers,
          operations: {
            ...newHandlers.operations,
            [operationId]: newHandler
          }
        }
      }
    }
  }

  if (handlers.paths !== undefined) {
    for (const [path, pathOperations] of Object.entries(handlers.paths)) {
      for (const [method, handler] of Object.entries(pathOperations)) {
        if (handler === undefined) continue
        const newHandler = mapFunction(handler, { method: method as HTTPRequestMethod, path })
        if (newHandler !== undefined) {
          newHandlers = {
            ...newHandlers,
            paths: {
              ...newHandlers.paths,
              [path]: {
                ...newHandlers?.paths?.[path],
                [method]: newHandler
              }
            }
          }
        }
      }
    }
  }

  if (handlers.default !== undefined) {
    const newHandler = mapFunction(handlers.default, 'default')
    if (newHandler !== undefined) {
      newHandlers.default = handlers.default
    }
  }

  return newHandlers
}
