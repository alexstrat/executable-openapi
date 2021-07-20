import type { OperationExecutionRequest } from 'executable-openapi-types'
import type { OpenAPIV3 } from 'openapi-types'

/**
 * Implements security requirements validation logic.
 */
export const validateSecurity = (
  security: OpenAPIV3.SecurityRequirementObject[],
  request: OperationExecutionRequest
): [boolean, { [schemeName: string]: string }] => {
  const schemeResults: { [schemeName: string]: string } = {}

  // Only one of the security requirement objects need to be satisfied to authorize a request
  const pass = security.some((securityRequirement) => {
    // empty security requirement => optional => pass
    if (Object.keys(securityRequirement).length === 0) return true

    // all schemes MUST be satisfied for a request to be authorized
    return Object.entries(securityRequirement).every(([securitySchemeName, scopes]) => {
      const requestSecurityForThisScheme = request.securities?.[securitySchemeName]

      // no entry in request's securities
      if (requestSecurityForThisScheme === false || requestSecurityForThisScheme === undefined) {
        schemeResults[securitySchemeName] = 'required but request not authorized'
        return false
      }
      const requestScopes = Array.isArray(requestSecurityForThisScheme) ? requestSecurityForThisScheme : []

      // no scopes required
      if (scopes.length === 0) {
        return true
      }

      // should match required scopes
      const missingScopes = scopes.filter((scope) => !requestScopes.includes(scope))
      if (missingScopes.length === 0) {
        return true
      }

      schemeResults[securitySchemeName] = `required scopes are missing: ${missingScopes.join(',')}`
      return false
    })
  })

  return [pass, schemeResults]
}
