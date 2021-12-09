import { ResponsesObject } from 'openapi3-ts'
import { ErrorObject } from 'ajv'

import { OperationExecutionResponse } from 'executable-openapi-types'

// WIP
export class InvalidPathParameterError extends Error /* HTTError */ {
  constructor (
    public name: string,
    public errors: ErrorObject[] | string
  ) {
    super(`Path parameter ${name} is not valid`)
  }
}

export function formatInvalidPathParameterResponse (
  error: InvalidPathParameterError,
  _responseObject: ResponsesObject
): OperationExecutionResponse {
  const message = typeof error.errors === 'string' ? error.errors : error.errors.map((e) => e.message).join(' and ')
  return {
    status: 400,
    content: {
      'application/json': {
        in: 'path',
        name: error.name,
        message
      }
    }
  }
}
