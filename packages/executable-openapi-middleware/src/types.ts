
import { HTTPRequestMethod, OperationExecutionResponse, OperationHandler, OperationInfo, Parameters, Body } from 'executable-openapi-types'

export type OperationMiddlewareHandler<TExecutionContext> = (
  handle: OperationHandler<TExecutionContext>,
  paramters: Parameters,
  body: Body,
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
