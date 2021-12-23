import { createRouter } from 'executable-openapi-router'
import { OpenAPIObject, ParameterObject } from 'openapi3-ts'
import { applyMiddleware } from 'executable-openapi-middleware'
import { request } from 'executable-openapi-test-utils'
import { ExecuteOperation, OperationHandler } from 'executable-openapi-types'
import { executableOpenAPIMiddlewareQueryParameters } from '..'

const getSandboxDocument = (
  path: string,
  operationParameters: ParameterObject[],
  pathParameters: ParameterObject[] = []
): OpenAPIObject => ({
  openapi: '3.1.0',
  info: {
    title: 'Example API',
    version: '1'
  },
  paths: {
    [path]: {
      parameters: pathParameters,
      get: {
        operationId: 'test',
        parameters: operationParameters,
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

const createQueryParametersSandbox = (
  path: string,
  parameters: ParameterObject[],
  pathLevelParameters?: ParameterObject[]
): Sandbox => {
  const document = getSandboxDocument(path, parameters, pathLevelParameters)
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
  }, executableOpenAPIMiddlewareQueryParameters())

  return {
    execute: createRouter(document, handlers),
    handler
  }
}

describe('executableOpenAPIMiddlewareQueryParameters', () => {
  let sandbox: Sandbox

  describe('with a integer path parameter', () => {
    beforeEach(() => {
      sandbox = createQueryParametersSandbox(
        '/hello',
        [{
          name: 'id',
          in: 'query',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1
          }
        }]
      )
    })
    it('should let an integer pass and coerce parameter value ', async () => {
      const { execute, handler } = sandbox
      await request(execute).get('/hello').query({ id: '5' }).expect(200)
      expect(handler.mock.calls[0][0]?.query?.id).toEqual(5)
    })

    it('should not let pass an invalid integer', async () => {
      const { execute } = sandbox
      const res = await await request(execute).get('/hello').query({ id: 'a' }).expect(400)
      expect(res?.content?.['application/json']).toMatchInlineSnapshot(`
  Object {
    "in": "query",
    "message": "must be integer",
    "name": "id",
  }
  `)
    })

    it('should not let pass integers that dont match schema', async () => {
      const { execute } = sandbox
      const res = await request(execute).get('/hello').query({ id: '0' }).expect(400)
      expect(res?.content?.['application/json']).toMatchInlineSnapshot(`
  Object {
    "in": "query",
    "message": "must be >= 1",
    "name": "id",
  }
  `)
    })
  })

  describe('with a boolean path parameter', () => {
    describe('wih allowEmptyValue', () => {
      beforeEach(() => {
        sandbox = createQueryParametersSandbox(
          '/hello',
          [{
            name: 'isFoo',
            in: 'query',
            allowEmptyValue: true,
            schema: {
              type: 'boolean'
            }
          }]
        )
      })
      it('should allow empty', async () => {
        const { execute, handler } = sandbox
        await request(execute).get('/hello').query({ isFoo: '' }).expect(200)
        expect(handler.mock.calls?.[0]?.[0]?.query?.isFoo).toEqual(true)
      })
      it('should have no value when nothing', async () => {
        const { execute, handler } = sandbox
        await request(execute).get('/hello').query({}).expect(200)
        expect(handler.mock.calls?.[0]?.[0]?.query?.isFoo).toEqual(undefined)
      })
    })
  })

  describe('when a parameter is required', () => {
    beforeEach(() => {
      sandbox = createQueryParametersSandbox(
        '/hello',
        [{
          name: 'important',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }]
      )
    })
    it('should not let pass if missing', async () => {
      const { execute } = sandbox
      const res = await request(execute).get('/hello').query({}).expect(400)
      expect(res?.content?.['application/json']).toMatchInlineSnapshot(`
Object {
  "in": "query",
  "message": "is required",
  "name": "important",
}
`)
    })
    it('should be good if present', async () => {
      const { execute } = sandbox
      await request(execute).get('/hello').query({ important: 'there' }).expect(200)
    })
  })
})
