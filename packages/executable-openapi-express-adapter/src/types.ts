import { ExecuteOperation, OperationExecutionResponse } from 'executable-openapi-types'
import * as express from 'express'

export type ExecutionContextFunction<TExecutionContext> = (
  req: express.Request,
  res: express.Response
) => TExecutionContext | Promise<TExecutionContext>

export type SecuritySchemeHandlerResult = boolean | string[]

export type SecuritySchemeHandlerFunction = (
  req: express.Request,
  res: express.Response
) => SecuritySchemeHandlerResult | Promise<SecuritySchemeHandlerResult>

export interface ExecutableOpenAPIExpressHandlerOptions<TExecutionContext> {
  execute: ExecuteOperation<TExecutionContext>

  /**
   * An object or a function that creates an object that'll be used as
   * execution context.
   *
   * This enables handlers and middlewares to share helpfull context such
   * as database connection or request's specific context like authenticated
   * user.
   */
  context?: TExecutionContext | ExecutionContextFunction<TExecutionContext>

  security?: {
    [securitySchemeName: string]: SecuritySchemeHandlerFunction
  }

  /**
   * Will use one of the corresponding formatter function to
   * format the response content before sending it depending on the
   * content type of the execution response.
   *
   * By default, `text/plain` will not be formated and `application/json`
   * `application/javascript` (JSONP) will use express default formatters
   * `res.json()`  and `res.jsonp()`.
   *
   * If execution response content type has no corresponding formater a 501
   * not implemeted will be served.
   *
   * ```ts
   * const xml = require('xml');
   * serveExecutableOpenAPI({
   *   execute,
   *   format: {
   *     'application/xml': (content) => xml(content),
   *   }
   * })
   * ```
   */
  format?: {
    [mimeType: string]: (
      content: unknown,
      executionResponse: OperationExecutionResponse,
      req: express.Request,
      res: express.Response
    ) => Promise<unknown> | unknown
  }
}
