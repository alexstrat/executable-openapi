
import { OpenAPIObject, OperationObject, PathItemObject } from 'openapi3-ts'
import {
  OperationExecutionRequest,
  OperationExecutionResponse
} from './execution'

export interface OperationInfo {
  executionRequest: OperationExecutionRequest
  document: OpenAPIObject
  operationObject: OperationObject
  pathItemObject: PathItemObject
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
