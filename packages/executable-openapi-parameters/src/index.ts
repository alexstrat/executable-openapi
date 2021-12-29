import { OperationObject, ParameterLocation, ParameterObject, PathItemObject, ResponsesObject } from 'openapi3-ts'
import Ajv, { ErrorObject, Schema } from 'ajv/dist/core'

import { OperationExecutionResponse } from 'executable-openapi-types'

type Validate = (data: unknown) => {
  pass: boolean
  errors?: ErrorObject[]
  data: unknown
}
/**
 * Will return a `validate` function that'll validate some data against
 * the given schema and using the given AJV instance.
 *
 * It's a tiny wrapper around `ajv.compile` that implements a trick to
 * properly coerce and use defaults when the root data is not an
 * object.
 * https://ajv.js.org/coercion.html
 */
export const compileAjvBasedValidate = (ajv: Ajv, schema: Schema): Validate => {
  // the trick is to include the value to validate in an object (with key `ROOT`)
  // and to run the validation on this object
  const ROOT = 'ROOT'
  const validate = ajv.compile({
    type: 'object',
    additionalProperties: false,
    properties: {
      [ROOT]: schema
    }
  })

  return (data: unknown) => {
    const toValidate = { [ROOT]: data }
    const pass = validate(toValidate)

    // extract the new data in case it was coerced
    const newData = toValidate[ROOT]

    return {
      pass,
      errors: validate.errors?.map((e) => ({
        ...e,
        // we need to remove the referene to `ROOT` so that
        // it looks like we ran the validation directly on the data
        instancePath: e.instancePath.replace(`/${ROOT}/`, '/'),
        schemaPath: e.schemaPath.replace(`#/properties/${ROOT}/`, '#/')
      })),
      data: newData
    }
  }
}

type RefResolver = ($ref: string) => Promise<unknown>

/**
 * Given `OperationObject` and `PathItemObject`, will resolve the parameters
 * specs by resolving and merging specs at both levels.
 */
export const resolveOperationParametersSpecs = async (
  operationObject: OperationObject,
  pathItemObject: PathItemObject,
  resolveRef: RefResolver
): Promise<ParameterObject[]> => {
  const pathLevelParametersSpecs = (await Promise.all(
    (pathItemObject.parameters ?? [])
      .map(async (p) => '$ref' in p ? await resolveRef(p.$ref) as ParameterObject : p)
  ))

  const operationLevelParametersSpecs = (await Promise.all(
    (operationObject.parameters ?? [])
      .map(async (p) => '$ref' in p ? await resolveRef(p.$ref) as ParameterObject : p)
  ))

  // operation specs override path level specs
  // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#fixed-fields-7
  const parametersSpecs = pathLevelParametersSpecs
  for (const spec of operationLevelParametersSpecs) {
    const overrideIndex = parametersSpecs.findIndex((s) => s.name === spec.name && s.in === spec.in)
    if (overrideIndex !== -1) {
      parametersSpecs[overrideIndex] = spec
    } else {
      parametersSpecs.push(spec)
    }
  }

  return parametersSpecs
}

// WIP https://git.io/Jymr8
export class InvalidParameterError extends Error /* HTTError */ {
  constructor (
    public name: string,
    public location: ParameterLocation,
    public errors: ErrorObject[] | string
  ) {
    super(`Parameter '${name}' in '${location}' in  is not valid`)
  }
}

export function formatInvalidParameterResponse (
  error: InvalidParameterError,
  _responseObject: ResponsesObject
): OperationExecutionResponse {
  const message = typeof error.errors === 'string' ? error.errors : error.errors.map((e) => e.message).join(' and ')
  return {
    status: 400,
    content: {
      'application/json': {
        in: error.location,
        name: error.name,
        message
      }
    }
  }
}
