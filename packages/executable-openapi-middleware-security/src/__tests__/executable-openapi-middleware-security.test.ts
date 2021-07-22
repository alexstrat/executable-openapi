import { createRouter } from 'executable-openapi-router'
import { OpenAPIV3 } from 'openapi-types'
import { applyMiddleware } from 'executable-openapi-middleware'
import { request } from 'executable-openapi-test-utils'
import { ExecuteOperation } from 'executable-openapi-types'
import { executableOpenAPIMiddlewareSecurity } from '..'

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
    await request(execute).get('/test').auth('BasicAuth').expect(200)
    await request(execute).get('/test').expect(403)
  })

  it('validates against 2 security requirements', async () => {
    const execute = createExecute([
      { BasicAuth: [] },
      { BearerAuth: [] }
    ])

    await request(execute).get('/test').auth('BasicAuth').expect(200)
    await request(execute).get('/test').auth('BearerAuth').expect(200)
    await request(execute).get('/test').expect(403)
  })

  it('validates against a document level requirement', async () => {
    const execute = createExecute(undefined, [
      { BasicAuth: [] }
    ])

    await request(execute).get('/test').auth('BasicAuth').expect(200)
    await request(execute).get('/test').expect(403)
  })

  it('validates against a operation level requirement overriding a document level requirement', async () => {
    const execute = createExecute([{ BearerAuth: [] }], [
      { BasicAuth: [] }
    ])

    await request(execute).get('/test').auth('BearerAuth').expect(200)
    await request(execute).get('/test').expect(403)
    await request(execute).get('/test').auth('BasicAuth').expect(403)
  })

  it('validates against a 2-schemes security requirement', async () => {
    const execute = createExecute([{
      BasicAuth: [],
      BearerAuth: []
    }])

    await request(execute).get('/test').auth('BasicAuth').auth('BearerAuth').expect(200)
    await request(execute).get('/test').auth('BasicAuth').expect(403)
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

    await request(execute).get('/test').auth('BasicAuth', ['admin', 'write']).expect(200)
    await request(execute).get('/test').auth('BasicAuth', []).expect(403)
    await request(execute).get('/test').auth('BasicAuth', ['admin']).expect(403)
  })
})
