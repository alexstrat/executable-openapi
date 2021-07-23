import { OpenAPIObject } from 'openapi3-ts'
import * as pointer from 'jsonpointer'

export type RefResolver<T = unknown> = ($ref: string) => Promise<T>

/**
 * Create a ref resolver that resolves only local references.
 */
export const localRefResolver = <T = unknown>(document: OpenAPIObject): RefResolver<T> => {
  const resolver = async ($ref: string): Promise<T> => {
    if (!$ref.startsWith('#')) {
      throw new Error(`${$ref} is a remote ref and can not be resolved`)
    }
    const res = pointer.get(document, $ref.substring(1))
    if (typeof res.$ref === 'string') {
      return await resolver(res.$ref)
    }
    return res
  }
  return resolver
}
