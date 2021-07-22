import { ExecuteOperation } from 'executable-openapi-types'
import { OperationExecutionRequestBuilder } from './request'
import { OperationExecutionTestAgent } from './test-agent'

export * from './request'
export * from './agent'
export * from './test-agent'

function request<TExecutionContext> (
  execute: ExecuteOperation<TExecutionContext>
): OperationExecutionTestAgent<TExecutionContext>
function request (): OperationExecutionRequestBuilder

function request<TExecutionContext> (
  execute?: ExecuteOperation<TExecutionContext>
): OperationExecutionTestAgent<TExecutionContext> | OperationExecutionRequestBuilder {
  if (execute !== undefined) return new OperationExecutionTestAgent<TExecutionContext>(execute)
  return new OperationExecutionRequestBuilder()
}

export { request }
