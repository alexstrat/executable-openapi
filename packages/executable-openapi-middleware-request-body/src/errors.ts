
import { ResponsesObject } from 'openapi3-ts'
import { ErrorObject } from 'ajv/dist/core'
import { OperationExecutionResponse } from 'executable-openapi-types'

// WIP https://git.io/Jymr8
export class InvalidRequestBodyError extends Error /* HTTError */ {
  constructor (
    public errors: ErrorObject[] | string
  ) {
    super('Request body is not valid')
  }
}

export function formatInvalidRequestBodyResponse (
  error: InvalidRequestBodyError,
  _responseObject: ResponsesObject
): OperationExecutionResponse {
  const message = typeof error.errors === 'string' ? error.errors : error.errors.map((e) => `${e.instancePath} ${e.message ?? 'not ok'}`).join(' and ')
  return {
    status: 400,
    content: {
      'application/json': {
        type: 'invalid-requestBody',
        message
      }
    }
  }
}
