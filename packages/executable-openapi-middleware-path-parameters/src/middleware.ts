import type { OperationMiddlewareHandler } from 'executable-openapi-middleware'
import { localRefResolver } from 'openapi-document-local-ref-resolver'
import * as uriTemplates from 'uri-templates'
import invariant from 'ts-invariant'
import * as memoize from 'memoizee'
import Ajv, { Format } from 'ajv/dist/2020'
import { ResponsesObject } from 'openapi3-ts'

import { OperationExecutionResponse } from 'executable-openapi-types'
import { compileAjvBasedValidate, formatInvalidParameterResponse, InvalidParameterError, resolveOperationParametersSpecs } from 'executable-openapi-parameters'

type RefResolver = ($ref: string) => Promise<unknown>

export type ExecutableOpenAPIMiddlewarePathParametersFormat = Format

export interface ExecutableOpenAPIMiddlewarePathParametersOption {
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
    [Name in string]?: ExecutableOpenAPIMiddlewarePathParametersFormat;
  }
}

export const executableOpenAPIMiddlewarePathParameters = <TExecutionContext>(
  {
    documentRefResolver,
    formatErrorResponse = formatInvalidParameterResponse,
    formats
  }: ExecutableOpenAPIMiddlewarePathParametersOption = {}
): OperationMiddlewareHandler<TExecutionContext> => {
  const ajv = new Ajv({
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: true,
    formats
  })

  const compileAjvBasedValidateCached = memoize(compileAjvBasedValidate)

  return async (handle, parameters, body, context, info) => {
    const originalPathParameters = parameters.path ?? {}

    const resolveRef = documentRefResolver ?? localRefResolver(info.document)

    // merge specs
    const parametersSpecs = await resolveOperationParametersSpecs(
      info.operationObject,
      info.pathItemObject,
      resolveRef
    )

    const pathParametersSpecs = parametersSpecs.filter((p) => p.in === 'path')

    const newPathParameters: Record<string, unknown> = {}

    for (const pathParametersSpec of pathParametersSpecs) {
      const { name, schema } = pathParametersSpec
      let value = originalPathParameters[name]

      // deserialize
      // if value was already not string we can assume it was already
      // processed => we just continue to coerce and validate
      if (typeof value === 'string') {
        const { style = 'simple' } = pathParametersSpec
        // todo: handle other parameters styles
        if (style !== 'simple') {
          throw new Error('NotImplemented: missing support for style other than simple (see https://git.io/JD1vU)')
        }
        const tpl = uriTemplates(`{${name}}`)
        value = tpl.fromUri(value)?.[name]
      }

      // per spec, path parameters are always required
      if (value === undefined) {
        const error = new InvalidParameterError(name, 'path', 'is required')
        return await formatErrorResponse(error, info.operationObject.responses)
      }

      // validates and coerce
      if (schema !== undefined) {
        // @ts-expect-error imcompatible options ?
        const validate = compileAjvBasedValidateCached(ajv, schema)

        const { pass, errors, data: newValue } = validate(value)
        if (!pass) {
          invariant(errors, '`validate` should return defined `errors` when `pass` is true')

          const error = new InvalidParameterError(name, 'path', errors)
          return await formatErrorResponse(error, info.operationObject.responses)
        }
        newPathParameters[name] = newValue
      } else {
        newPathParameters[name] = value
      }
    }
    return await handle({
      ...parameters,
      path: newPathParameters
    }, body, context, info)
  }
}
