import { createRouter } from 'executable-openapi-router'
import { OpenAPIObject, ParameterObject } from 'openapi3-ts'
import { applyMiddleware } from 'executable-openapi-middleware'
import { request } from 'executable-openapi-test-utils'
import { ExecuteOperation, OperationHandler } from 'executable-openapi-types'
import { executableOpenAPIMiddlewarePathParameters } from '..'

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

const createPathParametersSandbox = (
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
  }, executableOpenAPIMiddlewarePathParameters())

  return {
    execute: createRouter(document, handlers),
    handler
  }
}

describe('executableOpenAPIMiddlewarePathParameters', () => {
  let sandbox: Sandbox

  describe('with a integer path parameter', () => {
    beforeEach(() => {
      sandbox = createPathParametersSandbox(
        '/hello/{id}',
        [{
          name: 'id',
          in: 'path',
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
      await request(execute).get('/hello/5').expect(200)
      expect(handler.mock.calls[0][0]?.path?.id).toEqual(5)
    })

    it('should not let pass an invalid integer', async () => {
      const { execute } = sandbox
      const res = await await request(execute).get('/hello/a').expect(400)
      expect(res?.content?.['application/json']).toMatchInlineSnapshot(`
  Object {
    "in": "path",
    "message": "must be integer",
    "name": "id",
  }
  `)
    })

    it('should not let pass integers that dont match schema', async () => {
      const { execute } = sandbox
      const res = await request(execute).get('/hello/0').expect(400)
      expect(res?.content?.['application/json']).toMatchInlineSnapshot(`
  Object {
    "in": "path",
    "message": "must be >= 1",
    "name": "id",
  }
  `)
    })
  })

  describe('operation level parameters overrides path level', () => {
    beforeEach(() => {
      sandbox = createPathParametersSandbox(
        '/hello/{id}',
        [{
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            minimum: 3
          }
        }],
        [{
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1
          }
        }]
      )
    })
    it('should have orveriden', async () => {
      const { execute } = sandbox
      await request(execute).get('/hello/2').expect(400)
    })
  })
})
