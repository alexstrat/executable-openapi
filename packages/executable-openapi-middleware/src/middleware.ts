import { HandlersMap } from 'executable-openapi-router'
import { Middleware, OperationMiddlewareHandler } from './types'
import { mapOperationHandlers } from './utils'

export function applyMiddleware<TExecutionContext> (
  handlers: HandlersMap<TExecutionContext>,
  ...middlewareMaps: Array<Middleware<TExecutionContext>>
): HandlersMap<TExecutionContext> {
  return middlewareMaps.reduceRight((prevHandlers, middlewareMap) => {
    return mapOperationHandlers(
      prevHandlers,
      (handler, handlerInfo) => async (req, context, info) => {
        let middleware: OperationMiddlewareHandler<TExecutionContext> | undefined

        if (typeof middlewareMap === 'function') {
          middleware = middlewareMap
        } else if (handlerInfo === 'default') {
          middleware = middlewareMap.default
        } else {
          // let's try to find if this handler have a
          // correspondance in middleware map either
          // by `operationId` or by path/method
          if (info.operationObject.operationId !== undefined) {
            middleware = middlewareMap.operations?.[info.operationObject.operationId]
          }
          if (middleware === undefined) {
            middleware = middlewareMap.paths?.[info.path]?.[info.request.method]
          }
        }

        if (middleware !== undefined) {
          return await middleware(handler, req, context, info)
        } else {
          return await handler(req, context, info)
        }
      })
  }, handlers)
}
