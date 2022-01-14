import { ExecuteOperation } from 'executable-openapi-types'
import { OpenAPIObject } from 'openapi3-ts'
import { createRouter, HandlersMap } from 'executable-openapi-router'
import { applyMiddleware } from 'executable-openapi-middleware'
import { executableOpenAPIMiddlewarePathParameters } from 'executable-openapi-middleware-path-parameters'
import { executableOpenAPIMiddlewareQueryParameters } from 'executable-openapi-middleware-query-parameters'
import { executableOpenAPIMiddlewareSecurity } from 'executable-openapi-middleware-security'
import { executableOpenAPIMiddlewareRequestBody } from 'executable-openapi-middleware-request-body'

export interface CreateExecutableOpenAPIOptions<TContext> {
  document: OpenAPIObject
  handlers: HandlersMap<TContext>
  // todo: add more options for middlewares
}

/**
 * Create a OpenAPI operation execution function from an OpenAPI document
 * and handlers. The incoming operations will be checked against the OpenAPI
 * document.
 */
export function createExecutableOpenAPI<TContext> ({
  document,
  handlers
}: CreateExecutableOpenAPIOptions<TContext>): ExecuteOperation<TContext> {
  const middlewares = [
    executableOpenAPIMiddlewareSecurity<TContext>(),
    executableOpenAPIMiddlewarePathParameters<TContext>(),
    executableOpenAPIMiddlewareQueryParameters<TContext>(),
    executableOpenAPIMiddlewareRequestBody<TContext>()
  ]
  const newHandlers = applyMiddleware(handlers, ...middlewares)

  return createRouter(document, newHandlers)
}
