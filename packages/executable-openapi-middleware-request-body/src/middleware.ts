
import type { OperationMiddlewareHandler } from 'executable-openapi-middleware'
import { OperationExecutionResponse } from 'executable-openapi-types'
import { localRefResolver } from 'openapi-document-local-ref-resolver'
import { compileAjvBasedValidate } from 'executable-openapi-parameters'
import Ajv, { Format } from 'ajv/dist/2020'
import * as memoize from 'memoizee'
import { RequestBodyObject, ResponsesObject } from 'openapi3-ts'
import mimeMatch = require('mime-match')
import invariant from 'ts-invariant'
import { formatInvalidRequestBodyResponse, InvalidRequestBodyError } from './errors'

type RefResolver = ($ref: string) => Promise<unknown>

export interface ExecutableOpenAPIMiddlewareRequestBodyOptions {
  /**
   * A JSON reference resolver that'll be used to resolve
   * JSON references found in `document`.
   *
   * If not provided, `createRouter` will use a simple resolver
   * that only resolves local JSON pointer.
   */
  documentRefResolver?: RefResolver

  formatErrorResponse?: (
    error: InvalidRequestBodyError,
    responseObject: ResponsesObject
  ) => OperationExecutionResponse | Promise<OperationExecutionResponse>

  /**
   * An object with format definitions.
   */
  formats?: {
    [Name in string]?: Format;
  }
}

export const executableOpenAPIMiddlewareRequestBody = <TExecutionContext>({
  documentRefResolver,
  formatErrorResponse = formatInvalidRequestBodyResponse,
  formats
}: ExecutableOpenAPIMiddlewareRequestBodyOptions = {}): OperationMiddlewareHandler<TExecutionContext> => {
  const ajv = new Ajv({
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    formats
  })

  const compileAjvBasedValidateCached = memoize(compileAjvBasedValidate)
  return async (handle, parameters, body, context, info) => {
    const resolveRef = documentRefResolver ?? localRefResolver(info.document)

    const maybeRequestBody = info.operationObject.requestBody
    const requestBody = maybeRequestBody !== undefined && '$ref' in maybeRequestBody ? await resolveRef(maybeRequestBody.$ref) as RequestBodyObject : maybeRequestBody

    if (requestBody === undefined || Object.keys(requestBody.content).length === 0) {
      // no requestBody, we discard the body
      return await handle(parameters, undefined, context, info)
    }

    if (requestBody.required === true && body === undefined) {
      const error = new InvalidRequestBodyError('is missing')
      return await formatErrorResponse(error, info.operationObject.responses)
    }

    if (body === undefined) {
      return await handle(parameters, undefined, context, info)
    }
    // if body is present, executionRequest.body should be there
    invariant(info.executionRequest.body)

    const bodyMediaType = info.executionRequest.body.mediaType
    const mediaTypes = Object.keys(requestBody.content)
    const matchedMediaTypes = mediaTypes.filter((mediaType) => mimeMatch(bodyMediaType, mediaType))
    if (matchedMediaTypes.length === 0) {
      const error = new InvalidRequestBodyError(`Media type ${bodyMediaType} is not acceptable`)
      return await formatErrorResponse(error, info.operationObject.responses)
    }

    // todo: for requests that match multiple keys, only the most specific key is applicable. e.g. text/plain overrides text/*
    const contentSpec = requestBody.content[matchedMediaTypes[0]]

    if (contentSpec.schema !== undefined) {
      const validate = compileAjvBasedValidateCached(ajv, contentSpec.schema)
      const { pass, errors, data: newBody } = validate(body)
      if (!pass) {
        invariant(errors, '`validate` should return defined `errors` when `pass` is true')

        const error = new InvalidRequestBodyError(errors)
        return await formatErrorResponse(error, info.operationObject.responses)
      }
      return await handle(parameters, newBody, context, info)
    }

    return await handle(parameters, body, context, info)
  }
}
