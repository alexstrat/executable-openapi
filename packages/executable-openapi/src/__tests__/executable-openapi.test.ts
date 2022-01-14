import { request } from 'executable-openapi-test-utils'
import { ExecuteOperation, OperationExecutionResponse, OperationHandler } from 'executable-openapi-types'
import { OpenAPIObject } from 'openapi3-ts'
import { createExecutableOpenAPI } from '..'

const document: OpenAPIObject = {
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
      }
    }
  },
  paths: {
    '/foo/{id}': {
      post: {
        operationId: 'getFoo',
        security: [{ BasicAuth: [] }],
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1
          }
        }, {
          name: 'withFoo',
          in: 'query',
          required: true,
          allowEmptyValue: true,
          schema: {
            type: 'boolean'
          }
        }],
        requestBody: {
          content: {
            required: true,
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  }
                },
                required: ['message']
              }
            }
          }
        }
      }
    }
  }
}

describe('executable-openapi', () => {
  describe('createExecutableOpenAPI() returns an execution function', () => {
    let execute: ExecuteOperation<unknown>
    let handler: jest.Mock<ReturnType<OperationHandler<unknown>>>
    beforeEach(() => {
      handler = jest.fn(async (): Promise<OperationExecutionResponse> => ({
        status: 200
      }))
      execute = createExecutableOpenAPI({
        document,
        handlers: {
          operations: {
            getFoo: handler
          }
        }
      })
    })

    it('should work', async () => {
      await request(execute)
        .auth('BasicAuth')
        .post('/foo/1')
        .query({ withFoo: '' })
        .send({ message: 'Short message' })
        .expect(200)
      expect(handler).toHaveBeenCalled()
    })

    it('should validate security', async () => {
      await request(execute)
        // .auth('BasicAuth')
        .post('/foo/1')
        .query({ withFoo: '' })
        .send({ message: 'Short message' })
        .expect(403)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should validate path parameters', async () => {
      await request(execute)
        .auth('BasicAuth')
        .post('/foo/bloop')
        .query({ withFoo: '' })
        .send({ message: 'Short message' })
        .expect(400)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should validate query parameters', async () => {
      await request(execute)
        .auth('BasicAuth')
        .post('/foo/1')
        // .query({ withFoo: '' })
        .send({ message: 'Short message' })
        .expect(400)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should validate request body', async () => {
      await request(execute)
        .auth('BasicAuth')
        .post('/foo/1')
        .query({ withFoo: '' })
        .send({ anythingElse: 'Short message' })
        .expect(400)
      expect(handler).not.toHaveBeenCalled()
    })
  })
})
