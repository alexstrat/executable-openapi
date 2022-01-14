import { ExecuteOperation, OperationExecutionRequest, OperationExecutionResponse, OperationHandler } from 'executable-openapi-types'
import { OpenAPIObject, PathItemObject } from 'openapi3-ts'
import { params } from 'bath'
import { localRefResolver } from 'openapi-document-local-ref-resolver'
import { HandlersMap } from './types'
import { pathConcretenessCompareFunction } from './utils'

export interface CreateRouterOptions {
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
export function createRouter<TContext = undefined> (
  document: OpenAPIObject,
  handlers: HandlersMap<TContext>,
  options: CreateRouterOptions = {}
): ExecuteOperation<TContext> {
  const paths = Object.entries(document.paths)
    .map(([path, pathItemObject]) => [path, params(path), pathItemObject] as const)

  const defaultHandler = handlers.default !== undefined ? handlers.default : notImplementedHandler

  const resolveRef = options.documentRefResolver !== undefined ? options.documentRefResolver : localRefResolver(document)

  const execute = async (executionRequest: OperationExecutionRequest, context: TContext): Promise<OperationExecutionResponse | null> => {
    const matchedPaths = paths
      .map(([path, match, pathItemObject]) => [path, match(executionRequest.path), pathItemObject] as const)
      .filter(([, pathParameters]) => {
        if (pathParameters !== null) return true
        return false
      })
      // take the most contrete path
      .sort(([path1], [path2]) => pathConcretenessCompareFunction(path1, path2))

    // not a match
    if (matchedPaths.length === 0) return null

    const [path, pathParameters, pathItemObject] = matchedPaths[0]

    if (pathParameters === null) return null
    if (pathItemObject === undefined) return null

    let resolvedPathItemObject: PathItemObject
    if (pathItemObject.$ref !== undefined) {
      resolvedPathItemObject = await resolveRef(pathItemObject.$ref) as PathItemObject
    } else {
      resolvedPathItemObject = pathItemObject
    }
    const operationObject = resolvedPathItemObject[executionRequest.method]
    if (operationObject === undefined) return null

    const info = {
      document,
      executionRequest,
      operationObject,
      path,
      pathItemObject: resolvedPathItemObject
    }

    const parameters = {
      path: pathParameters,
      query: executionRequest.query
    }

    // find a handler
    const pathHandler = handlers?.paths?.[path][executionRequest.method]
    const operationHandler = operationObject.operationId !== undefined ? handlers?.operations?.[operationObject.operationId] : undefined
    const handler = (pathHandler !== undefined) ? pathHandler : operationHandler

    if (handler === undefined) {
      return await defaultHandler(parameters, executionRequest.body?.content, context, info)
    }

    return await handler(parameters, executionRequest.body?.content, context, info)
  }

  return execute as ExecuteOperation<TContext>
}

const notImplementedHandler: OperationHandler<unknown> = (_p, _b, _c, { path }) => {
  throw new Error(`No handler found for ${path}`)
}
