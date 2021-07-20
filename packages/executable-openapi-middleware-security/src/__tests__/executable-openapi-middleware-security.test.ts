import { createRouter } from 'executable-openapi-router'
import { OpenAPIV3 } from 'openapi-types'
import { applyMiddleware } from 'executable-openapi-middleware'
import { executableOpenAPIMiddlewareSecurity } from '..'
import { ExecuteOperation } from 'executable-openapi-types'

const document: OpenAPIV3.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Example API',
    version: '1'
  },
  components: {
    securitySchemes: {
      BasicAuth: {
        type: 'http',
        scheme: 'basic'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer'
      }
    }
  },
  paths: {
    '/test': {
      get: {
        security: [{ BasicAuth: [] }],
        operationId: 'hello',
        responses: {
          200: {
            description: 'fooo',
            content: {
              'application/json': {
                schema: {
                  properties: {
                    messgae: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

const createExecute = (
  security: OpenAPIV3.SecurityRequirementObject[] | undefined,
  documentSecurity?: OpenAPIV3.SecurityRequirementObject[]
): ExecuteOperation<unknown> => {
  const handlers = applyMiddleware({
    operations: {
      hello: () => ({
        status: 200,
        content: {
          'application/json': {
            message: 'test'
          }
        }
      })
    }
  }, executableOpenAPIMiddlewareSecurity())
  const newDocument = { ...document }

  if (security !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    newDocument.paths['/test']!.get!.security = security
  }

  if (documentSecurity !== undefined) {
    newDocument.security = documentSecurity
  }

  return createRouter(newDocument, handlers)
}

describe('executableOpenAPIMiddlewareSecurity', () => {
  it('validates against single security requirement', async () => {
    const execute = createExecute([{ BasicAuth: [] }])
    const pass = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: true }
    }, undefined)
    expect(pass?.status).toEqual(200)

    const notPass = await execute({
      method: 'get',
      path: '/test'
    }, undefined)
    expect(notPass?.status).toEqual(403)
  })

  it('validates against 2 security requirements', async () => {
    const execute = createExecute([
      { BasicAuth: [] },
      { BearerAuth: [] }
    ])

    const pass = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: true }
    }, undefined)
    expect(pass?.status).toEqual(200)

    const pass2 = await execute({
      method: 'get',
      path: '/test',
      securities: { BearerAuth: true }
    }, undefined)
    expect(pass2?.status).toEqual(200)

    const notPass = await execute({
      method: 'get',
      path: '/test'
    }, undefined)
    expect(notPass?.status).toEqual(403)
  })

  it('validates against 2 security requirements', async () => {
    const execute = createExecute([
      { BasicAuth: [] },
      { BearerAuth: [] }
    ])

    const pass = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: true }
    }, undefined)
    expect(pass?.status).toEqual(200)

    const pass2 = await execute({
      method: 'get',
      path: '/test',
      securities: { BearerAuth: true }
    }, undefined)
    expect(pass2?.status).toEqual(200)

    const notPass = await execute({
      method: 'get',
      path: '/test'
    }, undefined)
    expect(notPass?.status).toEqual(403)
  })

  it('validates against a document level requirement', async () => {
    const execute = createExecute(undefined, [
      { BasicAuth: [] }
    ])

    const pass = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: true }
    }, undefined)
    expect(pass?.status).toEqual(200)
    const notPass = await execute({
      method: 'get',
      path: '/test'
    }, undefined)
    expect(notPass?.status).toEqual(403)
  })

  it('validates against a operation level requirement overriding a document level requirement', async () => {
    const execute = createExecute([{ BearerAuth: [] }], [
      { BasicAuth: [] }
    ])

    const pass = await execute({
      method: 'get',
      path: '/test',
      securities: { BearerAuth: true }
    }, undefined)
    expect(pass?.status).toEqual(200)
    const notPass = await execute({
      method: 'get',
      path: '/test'
    }, undefined)
    expect(notPass?.status).toEqual(403)
    const notPass2 = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: true }
    }, undefined)
    expect(notPass2?.status).toEqual(403)
  })

  it('validates against a 2-schemes security requirement', async () => {
    const execute = createExecute([{
      BasicAuth: [],
      BearerAuth: []
    }])
    const pass = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: true, BearerAuth: true }
    }, undefined)
    expect(pass?.status).toEqual(200)

    const notPass = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: true }
    }, undefined)
    expect(notPass?.status).toEqual(403)
  })

  it('validates against a security requirement with scopes', async () => {
    const execute = createExecute([{
      BasicAuth: ['admin', 'write']
    }])
    const pass = await execute({
      method: 'get',
      path: '/test',
      securities: {
        BasicAuth: ['admin', 'write']
      }
    }, undefined)
    expect(pass?.status).toEqual(200)

    const notPass = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: [] }
    }, undefined)
    expect(notPass?.status).toEqual(403)

    const notPass2 = await execute({
      method: 'get',
      path: '/test',
      securities: { BasicAuth: ['admin'] }
    }, undefined)
    expect(notPass2?.status).toEqual(403)
  })
})
