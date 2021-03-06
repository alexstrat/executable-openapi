import { createRouter, HandlersMap } from 'executable-openapi-router'
import { ExecuteOperation, OperationHandler } from 'executable-openapi-types'
import { OpenAPIObject } from 'openapi3-ts'
import { request } from 'executable-openapi-test-utils'
import { applyMiddleware } from '..'

const document: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Example API',
    version: '1'
  },
  paths: {
    '/foo/{fooId}': {
      get: {
        operationId: 'getFoo'
      }
    },
    '/bar/{barId}': {
      get: {
        operationId: 'getBar'
      }
    },
    '/user/{id}': { get: {} },
    '/user/none': { get: {} }
  }
}

type MockHandler = jest.Mock<ReturnType<OperationHandler<unknown>>, Parameters<OperationHandler<unknown>>>

describe('executable-openapi-middleware', () => {
  describe('applyMiddleware', () => {
    let getBarHandler: MockHandler
    let getFooHandler: MockHandler
    let handlers: HandlersMap<unknown>
    let spy: jest.Mock<void, [string?]>
    let execute: ExecuteOperation<undefined>

    beforeEach(() => {
      getBarHandler = jest.fn(async (..._) => ({ status: 500 }))
      getFooHandler = jest.fn(async (..._) => ({ status: 500 }))

      handlers = {
        operations: {
          getBar: getBarHandler,
          getFoo: getFooHandler
        }
      }
    })

    describe('when applying a global middleware', () => {
      beforeEach(() => {
        spy = jest.fn()

        const newHandlers = applyMiddleware(
          handlers,
          async (handler, ...rest) => {
            spy()
            return await handler(...rest)
          })
        execute = createRouter<undefined>(document, newHandlers)
      })

      it('gets called on any path', async () => {
        await request(execute).get('/bar/12')
        expect(spy).toHaveBeenCalled()
        expect(getBarHandler).toHaveBeenCalled()
      })
    })

    describe('when applying by operation', () => {
      beforeEach(() => {
        spy = jest.fn()
        const newHandlers = applyMiddleware(handlers, {
          operations: {
            getBar: async (handler, ...rest) => {
              spy()
              return await handler(...rest)
            }
          }
        })

        execute = createRouter<undefined>(document, newHandlers)
      })

      it('applies middleware on the operation', async () => {
        await request(execute).get('/bar/12')
        expect(spy).toHaveBeenCalled()
        expect(getBarHandler).toHaveBeenCalled()
      })

      it('does not apply middleware on other operations', async () => {
        await request(execute).get('/foo/12')
        expect(spy).not.toHaveBeenCalled()
        expect(getFooHandler).toHaveBeenCalled()
      })
    })

    describe('when applying by paths/method', () => {
      beforeEach(() => {
        spy = jest.fn()
        const newHandlers = applyMiddleware(handlers, {
          paths: {
            '/bar/{barId}': {
              get: async (handler, ...rest) => {
                spy()
                return await handler(...rest)
              }
            }
          }
        })

        execute = createRouter<undefined>(document, newHandlers)
      })

      it('applies middleware on the path', async () => {
        await request(execute).get('/bar/12')
        expect(spy).toHaveBeenCalled()
        expect(getBarHandler).toHaveBeenCalled()
      })

      it('does not apply middleware on other paths', async () => {
        await request(execute).get('/foo/12')
        expect(spy).not.toHaveBeenCalled()
        expect(getFooHandler).toHaveBeenCalled()
      })
    })

    describe('when applying 2 middlewares', () => {
      beforeEach(() => {
        spy = jest.fn()
        const newHandlers = applyMiddleware(handlers,
          async (handler, ...rest) => {
            spy('middleware-1-before')
            const res = await handler(...rest)
            spy('middleware-1-after')
            return res
          },
          async (handler, ...rest) => {
            spy('middleware-2-before')
            const res = await handler(...rest)
            spy('middleware-2-after')
            return res
          })

        execute = createRouter<undefined>(document, newHandlers)
      })

      it('applies middlewares in order', async () => {
        await request(execute).get('/bar/12')
        expect(spy.mock.calls).toMatchObject([
          ['middleware-1-before'],
          ['middleware-2-before'],
          ['middleware-2-after'],
          ['middleware-1-after']
        ])
      })
    })
  })
})
