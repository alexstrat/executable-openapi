import { createRouter, HandlersMap, OperationHandler } from 'executable-openapi-router'
import { ExecuteOperation } from 'executable-openapi-types'
import { OpenAPIV3 } from 'openapi-types'
import { applyMiddleware } from '..'

const document: OpenAPIV3.Document = {
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
        await execute({ path: '/bar/12', method: 'get' })
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
        await execute({ path: '/bar/12', method: 'get' })
        expect(spy).toHaveBeenCalled()
        expect(getBarHandler).toHaveBeenCalled()
      })

      it('does not apply middleware on other operations', async () => {
        await execute({ path: '/foo/12', method: 'get' })
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
        await execute({ path: '/bar/12', method: 'get' })
        expect(spy).toHaveBeenCalled()
        expect(getBarHandler).toHaveBeenCalled()
      })

      it('does not apply middleware on other paths', async () => {
        await execute({ path: '/foo/12', method: 'get' })
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
        await execute({ path: '/bar/12', method: 'get' })
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
