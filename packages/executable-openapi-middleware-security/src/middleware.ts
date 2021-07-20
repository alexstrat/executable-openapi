import { ExecutableOpenAPIMiddlewareSecurity } from './types'
import type { OperationMiddlewareHandler } from 'executable-openapi-middleware'
import type { OperationExecutionResponse } from 'executable-openapi-types'
import { validateSecurity } from './validation'

/**
 * Will create a middleware that validates the incoming request
 * against document's and operations security requirements.
 *
 * If the request does not meet the security requirements, the
 * middleware will directly return a 403 response. This behavior
 * is overidable with `forbiddenResponse` option.
 */
export const executableOpenAPIMiddlewareSecurity = <TExecutionContext>({
  forbiddenResponse = defaultForbiddenResponse
}: ExecutableOpenAPIMiddlewareSecurity<TExecutionContext> = {}): OperationMiddlewareHandler<TExecutionContext> => {
  return async (handle, req, context, info) => {
    const { operationObject, document, request } = info

    // Security at operation level overrides global security
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#fixed-fields
    const security = operationObject.security !== undefined ? operationObject.security : document.security

    if (security === undefined) {
      return await handle(req, context, info)
    }

    const [pass, schemeResults] = validateSecurity(security, request)
    if (!pass) {
      return await forbiddenResponse(schemeResults, req, context, info)
    }

    return await handle(req, context, info)
  }
}

export const defaultForbiddenResponse = (): OperationExecutionResponse => ({
  status: 403
})
