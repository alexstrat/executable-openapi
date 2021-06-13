import { ExecuteOperation, OperationExecutionRequest, OperationExecutionResponse } from 'executable-openapi-types'
import { OpenAPIV3 } from 'openapi-types'
import { params } from 'bath'
import * as pointer from 'jsonpointer'
import { HandlersMap, OperationHandler } from './types'

interface CreateRouterOptions {
  /**
   * A JSON reference resolver that'll be used to resolve
   * JSON references found in `document`.
   *
   * If not provided, `createRouter` will use a simple resolver
   * that only resolves local JSON pointer.
   */
  documentRefResolver?: RefResolver
}
type RefResolver = ($ref: string) => Promise<unknown>

/**
 * Create a router, ie an [execution operation function](executable-openapi-types/modules#executeoperation)
 * that'll route operation to operation handlers given in `handlers`.
 *
 * @param document - An OpenAPI document describing the service
 * @param handlers - A map of handlers
 * @param options -  `CreateRouterOptions`
 */
export const createRouter = <TContext = undefined>(
  document: OpenAPIV3.Document,
  handlers: HandlersMap<TContext>,
  options: CreateRouterOptions = {}
): ExecuteOperation<TContext> => {
  const paths = Object.entries(document.paths)
    .map(([path, pathItemObject]) => [path, params(path), pathItemObject] as const)

  const defaultHandler = handlers.default !== undefined ? handlers.default : notImplementedHandler

  const $ref = options.documentRefResolver !== undefined ? options.documentRefResolver : createDefaultRefResolver(document)

  const execute = async (request: OperationExecutionRequest, context: TContext): Promise<OperationExecutionResponse | null> => {
    for (const [path, match, pathItemObject] of paths) {
      const pathParameters = match(request.path)

      if (pathParameters === null) {
        // not a match
        continue
      }

      if (pathItemObject === undefined) return null

      let resolvedPathItemObject: OpenAPIV3.PathItemObject | undefined
      if (pathItemObject.$ref !== undefined) {
        resolvedPathItemObject = await $ref(pathItemObject.$ref) as OpenAPIV3.PathItemObject
      } else {
        resolvedPathItemObject = pathItemObject
      }
      const operationObject = resolvedPathItemObject[request.method]
      if (operationObject === undefined) return null

      const info = {
        document,
        request,
        operationObject,
        path,
        pathItemObject: resolvedPathItemObject
      }

      const req = {
        parameters: {
          path: pathParameters
        }
      }

      // find a handler
      const pathHandler = handlers?.paths?.[path][request.method]
      const operationHandler = operationObject.operationId !== undefined ? handlers?.operations?.[operationObject.operationId] : undefined
      const handler = (pathHandler !== undefined) ? pathHandler : operationHandler

      if (handler === undefined) {
        return await defaultHandler(req, context, info)
      }

      return await handler(req, context, info)
    }

    // no match found
    return null
  }

  return execute as ExecuteOperation<TContext>
}

const notImplementedHandler: OperationHandler<unknown> = (_, __, { path }) => {
  throw new Error(`No handler found for ${path}`)
}

const createDefaultRefResolver = (document: OpenAPIV3.Document): RefResolver => {
  const resolver = async ($ref: string): Promise<unknown> => {
    if (!$ref.startsWith('#')) {
      throw new Error(`${$ref} is a remote ref and can not be resolved`)
    }
    const res = pointer.get(document, $ref.substring(1))
    if (typeof res.$ref === 'string') {
      return await resolver(res.$ref)
    }
    return res
  }
  return resolver
}
