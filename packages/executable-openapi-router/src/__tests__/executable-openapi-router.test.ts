import { OperationExecutionResponse, Parameters } from 'executable-openapi-types'
import { request } from 'executable-openapi-test-utils'
import { OpenAPIV3 } from 'openapi-types'
import { createRouter } from '..'

const document: OpenAPIV3.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Example API',
    version: '1'
  },
  paths: {
    '/foo/{id}': {
      get: { }
    },
    '/bar/{barId}/foo': {
      post: {
        operationId: 'createBar'
      }
    },
    '/foos/{id}': {
      $ref: '#/paths/~1foo~1{id}'
    },
    '/user/{id}': { get: {} },
    '/user/none': { get: {} }
  }
}

describe('executable-openapi-router', () => {
  test('calls handler given by paths', async () => {
    const handler = jest.fn(async (_: Parameters): Promise<OperationExecutionResponse> => ({
      status: 200
    }))
    const execute = createRouter(document,
      {
        paths: {
          '/foo/{id}': {
            get: handler
          }
        }
      })

    await request(execute).get('/foo/1').expect(200)

    expect(handler).toHaveBeenCalled()
    expect(handler.mock.calls[0][0]).toMatchObject({ path: { id: '1' } })
  })

  test('resolves ref', async () => {
    const handler = jest.fn(async (_: Parameters): Promise<OperationExecutionResponse> => ({
      status: 200
    }))
    const execute = createRouter(document,
      {
        paths: {
          '/foos/{id}': {
            get: handler
          }
        }
      })

    await request(execute).get('/foos/1').expect(200)

    expect(handler).toHaveBeenCalled()
    expect(handler.mock.calls[0][0]).toMatchObject({ path: { id: '1' } })
  })

  test('call handler given by operationId', async () => {
    const handler = jest.fn(async (_: Parameters): Promise<OperationExecutionResponse> => ({
      status: 200
    }))
    const execute = createRouter(document,
      {
        operations: {
          createBar: handler
        }
      })

    await request(execute).post('/bar/1/foo').expect(200)

    expect(handler).toHaveBeenCalled()
    expect(handler.mock.calls[0][0]).toMatchObject({ path: { barId: '1' } })
  })

  test('return null when path is not in document', async () => {
    const handler = jest.fn(async (_: Parameters): Promise<OperationExecutionResponse> => ({
      status: 200
    }))
    const execute = createRouter(document,
      {
        operations: {
          createBar: handler
        }
      })

    const res = await request(execute).post('/not-our-api')

    expect(handler).not.toHaveBeenCalled()
    expect(res).toEqual(null)
  })

  test('throw when no handler found', async () => {
    const execute = createRouter(document, {})

    await expect(request(execute).get('/foo/1')).rejects.toThrow('No handler found for /foo/{id}')
  })

  test('call default handler when provided and no handler found', async () => {
    const handler = jest.fn(async (_: Parameters): Promise<OperationExecutionResponse> => ({
      status: 500
    }))
    const execute = createRouter(document, { default: handler })

    await request(execute).get('/foo/1')

    expect(handler).toHaveBeenCalled()
  })

  test('match concrete routes before templated ones', async () => {
    const handler = jest.fn(async (_: Parameters): Promise<OperationExecutionResponse> => ({
      status: 500
    }))
    const handlerConcrete = jest.fn(async (_: Parameters): Promise<OperationExecutionResponse> => ({
      status: 500
    }))
    const execute = createRouter(document, {
      paths: {
        '/user/{id}': { get: handler },
        '/user/none': { get: handlerConcrete }
      }
    })

    await request(execute).get('/user/none')

    expect(handlerConcrete).toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })
})
