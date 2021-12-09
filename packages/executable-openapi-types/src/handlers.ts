
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
  path?: Record<string, unknown>
  // todo:
  // query
  // cookies
  // header
}

// todo: to be defined
export type Body = unknown

export type OperationHandler<TContext> = (
  parameters: Parameters,
  body: Body,
  context: TContext,
  info: OperationInfo
) => OperationExecutionResponse | Promise<OperationExecutionResponse>
