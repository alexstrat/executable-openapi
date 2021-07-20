
import { OpenAPIV3 } from 'openapi-types'
import {
  OperationExecutionRequest,
  OperationExecutionResponse
} from './execution'

export interface OperationInfo {
  executionRequest: OperationExecutionRequest
  document: OpenAPIV3.Document
  operationObject: OpenAPIV3.OperationObject
  pathItemObject: OpenAPIV3.PathItemObject
  path: string
}

export interface Parameters {
  path?: {
    [paramName: string]: string
  }
  // todo:
  // query
  // cookies
  // header
}

// todo: to be defined
export type Body = unknown

export type OperationHandler<TContext> = (
  paramters: Parameters,
  body: Body,
  context: TContext,
  info: OperationInfo
) => OperationExecutionResponse | Promise<OperationExecutionResponse>
