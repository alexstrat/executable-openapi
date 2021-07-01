import {
  HTTPRequestMethod,
  OperationExecutionRequest,
  OperationExecutionResponse
} from 'executable-openapi-types'
import { OpenAPIV3 } from 'openapi-types'

export interface Request {
  parameters?: {
    path?: {
      [paramName: string]: string
    }
  }
}

export type OperationHandler<TContext> = (
  req: Request,
  context: TContext,
  info: OperationInfo
) => OperationExecutionResponse | Promise<OperationExecutionResponse>

export interface OperationInfo {
  request: OperationExecutionRequest
  document: OpenAPIV3.Document
  operationObject: OpenAPIV3.OperationObject
  pathItemObject: OpenAPIV3.PathItemObject
  path: string
}

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
