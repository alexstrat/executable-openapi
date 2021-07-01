import * as express from 'express'
import { HTTPRequestMethod } from 'executable-openapi-types'
import { NotImplemented } from 'http-errors'
import * as parseurl from 'parseurl'
import { ExecutableOpenAPIExpressHandlerOptions, SecuritySchemeHandlerResult } from './types'

/**
 * Returns an Express handler that'll execute the incoming request
 * towards the OpenAPI execution function `options.execute`.
 *
 * **Content negociation**: the execution function `execute` should
 * return a content for each content types supported by this
 * operation response. `serveExecutableOpenAPI` will take care of
 * the content negociation and serve in the appropriate content type
 * depending on the incoming request. Will return `406 Not Acceptable`
 * otherwise.
 */
export function executableOpenAPIExpressHandler<TExecutionContext> ({
  execute,
  context: contextFn,
  security: securityMap = {},
  format = {}
}: ExecutableOpenAPIExpressHandlerOptions<TExecutionContext>
): express.Handler {
  return async (req, res, next) => {
    const method = toMethod(req.method)
    if (method === null) {
      // not in service realm => pass to next middleware
      return next()
    }

    // resolve context
    // https://github.com/microsoft/TypeScript/issues/37663
    const context = contextFn instanceof Function ? await contextFn(req, res) : contextFn

    // resolve security
    const securityEntries = await Promise.all(
      Object.entries(securityMap)
        .map(
          async ([scheme, schemeHandler]) => [
            scheme,
            await schemeHandler(req, res)
          ] as const)
    )
    const securities: { [scheme: string]: SecuritySchemeHandlerResult} = {}
    securityEntries.forEach(([scheme, result]) => {
      securities[scheme] = result
    })

    let body
    if (req.headers['content-type'] !== undefined && req.body !== undefined) {
      body = {
        // todo: figure what type `body` should be
        [req.headers['content-type']]: req.body
      }
    }

    const result = await execute({
      path: req.path,
      method,
      securities,
      headers: req.headers,
      // @ts-expect-error todo: fix this by understanding what type `query` should be
      query: parseurl(req).query,
      body
    }, context as TExecutionContext)

    // not in service realm => pass to next middleware
    if (result === null) {
      return next()
    }

    res.status(result.status)

    if (result.content !== undefined) {
      const contentType = req.accepts(Object.keys(result.content))
      if (contentType === false) {
        return res.sendStatus(406)
      }
      if (typeof format[contentType] === 'function') {
        res.type(contentType)
        const formated = await format[contentType](
          result.content[contentType],
          result,
          req,
          res
        )
        res.send(formated)

      // use express default formaters
      } else if (contentType === 'text/plain') {
        res.send(result.content['text/plain'])
      } else if (contentType === 'application/json') {
        res.json(result.content['application/json'])
      } else if (contentType === 'application/javascript') {
        res.jsonp(result.content['application/javascript'])
      } else {
        throw new NotImplemented(`Missing a formater for content type ${contentType}`)
      }
    }
  }
};

const toMethod = (method: string): HTTPRequestMethod | null => {
  switch (method) {
    case 'GET':
      return 'get'
    case 'PUT':
      return 'put'
    case 'POST':
      return 'post'
    case 'DELETE':
      return 'delete'
    case 'OPTIONS':
      return 'options'
    case 'HEAD':
      return 'head'
    case 'PATCH':
      return 'patch'
    case 'TRACE':
      return 'trace'
    default:
      return null
  }
}
