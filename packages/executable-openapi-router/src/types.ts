import { HTTPRequestMethod, OperationHandler } from 'executable-openapi-types'

export interface HandlersMap<TExecutionContext> {
  paths?: {
    [path: string]: {
      [method in HTTPRequestMethod]?: OperationHandler<TExecutionContext>
    }
  }
  operations?: {
    [operationId: string]: OperationHandler<TExecutionContext>
  }
  default?: OperationHandler<TExecutionContext>
}
