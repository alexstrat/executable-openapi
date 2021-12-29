import { OpenAPIObject, RequestBodyObject } from 'openapi3-ts'
import { request } from 'executable-openapi-test-utils'
import { applyMiddleware } from 'executable-openapi-middleware'
import { createRouter } from 'executable-openapi-router'
import { ExecuteOperation, OperationHandler } from 'executable-openapi-types'
import { executableOpenAPIMiddlewareRequestBody } from '..'

const getSandboxDocument = (
  path: string,
  requestBody: RequestBodyObject | undefined
): OpenAPIObject => ({
  openapi: '3.1.0',
  info: {
    title: 'Example API',
    version: '1'
  },
  paths: {
    [path]: {
      post: {
        operationId: 'test',
        requestBody,
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
})
interface Sandbox {
  execute: ExecuteOperation<unknown>
  handler: jest.Mock<ReturnType<OperationHandler<unknown>>, Parameters<OperationHandler<unknown>>>
}

const createRequestBodySandbox = (
  path: string,
  requestBody: RequestBodyObject | undefined
): Sandbox => {
  const document = getSandboxDocument(path, requestBody)
  const handler = jest.fn<
  ReturnType<OperationHandler<unknown>>,
  Parameters<OperationHandler<unknown>>
  >(() => ({
    status: 200,
    content: {
      'application/json': {
        message: 'test'
      }
    }
  }))

  const handlers = applyMiddleware({
    operations: {
      test: handler
    }
  }, executableOpenAPIMiddlewareRequestBody())

  return {
    execute: createRouter(document, handlers),
    handler
  }
}

describe('executableOpenAPIMiddlewareRequestBody', () => {
  let sandbox: Sandbox
  describe('without `requestBody` spec', () => {
    beforeEach(() => {
      sandbox = createRequestBodySandbox('/hello', undefined)
    })
    it('should discard the `body` in handler', async () => {
      const { execute, handler } = sandbox
      await request(execute).post('/hello').send({ foo: 'bar' }).end()
      expect(handler.mock.calls[0][1]).toEqual(undefined)
    })
  })

  describe('when `requestBody` is required', () => {
    beforeEach(() => {
      sandbox = createRequestBodySandbox('/hello', {
        content: {
          'application/json': {}
        },
        required: true
      })
    })

    it('should return an error when body is missing', async () => {
      const { execute, handler } = sandbox
      const res = await request(execute).post('/hello').expect(400)
      expect(handler).not.toHaveBeenCalled()
      expect(res?.content?.['application/json']).toMatchInlineSnapshot(`
Object {
  "message": "is missing",
  "type": "invalid-requestBody",
}
`)
    })
    it('should be ok when body is not missing', async () => {
      const { execute, handler } = sandbox
      await request(execute).post('/hello').send({ foo: 'bar' }).expect(200)
      expect(handler).toHaveBeenCalled()
      expect(handler.mock.calls[0][1]).toEqual({ foo: 'bar' })
    })
  })

  describe('with `requestBody`\'s `content`', () => {
    describe('when request\'s content type have no match', () => {
      beforeEach(() => {
        sandbox = createRequestBodySandbox('/hello', {
          content: {
            'application/json': {}
          }
        })
      })
      it('should return an error', async () => {
        const { execute, handler } = sandbox
        const res = await request(execute).post('/hello').send('text/plain', 'hi').expect(400)
        expect(handler).not.toHaveBeenCalled()
        expect(res?.content?.['application/json']).toMatchInlineSnapshot(`
Object {
  "message": "Media type text/plain is not acceptable",
  "type": "invalid-requestBody",
}
`)
      })
    })
    describe('has a wildcard content type', () => {
      beforeEach(() => {
        sandbox = createRequestBodySandbox('/hello', {
          content: {
            'text/*': {}
          }
        })
      })
      it('it should match', async () => {
        const { execute, handler } = sandbox
        await request(execute).post('/hello').send('text/plain', 'hi').expect(200)
        expect(handler).toHaveBeenCalled()
      })
    })
  })

  describe('when `requestBody` has a schema', () => {
    beforeEach(() => {
      sandbox = createRequestBodySandbox('/hello', {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                foo: {
                  type: 'number'
                }
              },
              required: ['foo']
            }
          }
        }
      })
    })
    it('should return errors body that does not match schema', async () => {
      const { execute, handler } = sandbox
      const res = await request(execute).post('/hello').send({ foo: 'a' }).expect(400)
      expect(handler).not.toHaveBeenCalled()
      expect(res?.content?.['application/json']).toMatchInlineSnapshot(`
Object {
  "message": "/foo must be number",
  "type": "invalid-requestBody",
}
`)
    })
    it('should be ok with body that matches schema', async () => {
      const { execute, handler } = sandbox
      await request(execute).post('/hello').send({ foo: 1 }).expect(200)
      expect(handler).toHaveBeenCalled()
    })
  })
})
