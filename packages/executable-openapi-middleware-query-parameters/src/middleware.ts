import type { OperationMiddlewareHandler } from 'executable-openapi-middleware'
import { localRefResolver } from 'openapi-document-local-ref-resolver'
import { formatInvalidParameterResponse, InvalidParameterError, resolveOperationParametersSpecs, compileAjvBasedValidate } from 'executable-openapi-parameters'
import Ajv, { Format } from 'ajv/dist/2020'
import * as memoize from 'memoizee'
import { ResponsesObject } from 'openapi3-ts'
import { OperationExecutionResponse } from 'executable-openapi-types'
import invariant from 'ts-invariant'

type RefResolver = ($ref: string) => Promise<unknown>

export type ExecutableOpenAPIMiddlewareQueryParametersFormat = Format

export interface ExecutableOpenAPIMiddlewareQueryParametersOption {
  /**
   * A JSON reference resolver that'll be used to resolve
   * JSON references found in `document`.
   *
   * If not provided, `createRouter` will use a simple resolver
   * that only resolves local JSON pointer.
   */
  documentRefResolver?: RefResolver

  formatErrorResponse?: (
    error: InvalidParameterError,
    responseObject: ResponsesObject
  ) => OperationExecutionResponse | Promise<OperationExecutionResponse>

  /**
   * An object with format definitions.
   */
  formats?: {
    [Name in string]?: ExecutableOpenAPIMiddlewareQueryParametersFormat;
  }
}

export const executableOpenAPIMiddlewareQueryParameters = <TExecutionContext>(
  {
    documentRefResolver,
    formatErrorResponse = formatInvalidParameterResponse,
    formats
  }: ExecutableOpenAPIMiddlewareQueryParametersOption = {}
): OperationMiddlewareHandler<TExecutionContext> => {
  const ajv = new Ajv({
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    formats
  })

  const compileAjvBasedValidateCached = memoize(compileAjvBasedValidate)

  return async (handle, parameters, body, context, info) => {
    const originalQueryParameters = parameters.query ?? {}
    const resolveRef = documentRefResolver ?? localRefResolver(info.document)

    const parametersSpecs = await resolveOperationParametersSpecs(
      info.operationObject,
      info.pathItemObject,
      resolveRef
    )

    const queryParametersSpecs = parametersSpecs.filter((p) => p.in === 'query')

    const newQueryParameters: Record<string, unknown> = {}
    for (const spec of queryParametersSpecs) {
      const { name, schema, required } = spec
      let value = originalQueryParameters[name]

      if (spec.allowEmptyValue === true && value === '') {
        value = true
      }

      if (required === true && value === undefined) {
        const error = new InvalidParameterError(name, 'query', 'is required')
        return await formatErrorResponse(error, info.operationObject.responses)
      }

      // validates and coerce
      if (schema !== undefined) {
        const validate = compileAjvBasedValidateCached(ajv, schema)

        const { pass, errors, data: newValue } = validate(value)
        if (!pass) {
          invariant(errors, '`validate` should return defined `errors` when `pass` is true')

          const error = new InvalidParameterError(name, 'query', errors)
          return await formatErrorResponse(error, info.operationObject.responses)
        }
        newQueryParameters[name] = newValue
      } else {
        newQueryParameters[name] = value
      }
    }
    return await handle({
      ...parameters,
      query: newQueryParameters
    }, body, context, info)
  }
}
