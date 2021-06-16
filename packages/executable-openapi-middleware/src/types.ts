
import { OperationHandler, Request, OperationInfo } from 'executable-openapi-router'
import { HTTPRequestMethod, OperationExecutionResponse } from 'executable-openapi-types'

export type OperationMiddlewareHandler<TExecutionContext> = (
  handle: OperationHandler<TExecutionContext>,
  req: Request,
  context: TExecutionContext,
  info: OperationInfo
) => Promise<OperationExecutionResponse>

export interface OperationMiddlewareMap<TExecutionContext> {
  paths?: {
    [path: string]: {
      [method in HTTPRequestMethod]?: OperationMiddlewareHandler<TExecutionContext>
    }
  }
  operations?: {
    [operationId: string]: OperationMiddlewareHandler<TExecutionContext>
  }
  default?: OperationMiddlewareHandler<TExecutionContext>
}

export type Middleware<TExecutionContext> = OperationMiddlewareMap<TExecutionContext> | OperationMiddlewareHandler<TExecutionContext>
