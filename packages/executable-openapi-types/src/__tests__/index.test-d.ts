import { expectError } from 'tsd'
import { ExecuteOperation, OperationExecutionRequest } from '..'

const req: OperationExecutionRequest = {
  method: 'get',
  path: '/foo'
}
const executeWithContext: ExecuteOperation<{}> = async () => null
expectError(executeWithContext(req))
executeWithContext(req, {})

const executeWithoutContext: ExecuteOperation<undefined> = async () => null
executeWithoutContext(req)
expectError(executeWithoutContext(req, {}))
