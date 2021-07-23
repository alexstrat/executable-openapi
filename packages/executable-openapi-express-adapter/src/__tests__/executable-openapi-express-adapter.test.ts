import express = require('express')
import { OpenAPIObject } from 'openapi3-ts'
import { createRouter } from 'executable-openapi-router'
import { ExecuteOperation } from 'executable-openapi-types'

import { executableOpenAPIExpressHandler } from '..'
import supertest = require('supertest')

const document: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Example API',
    version: '1'
  },
  paths: {
    '/hello/{name}': {
      get: {
        operationId: 'hello',
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
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
describe('executable-openapi-express-adapter', () => {
  let execute: ExecuteOperation<undefined>
  beforeEach(() => {
    execute = createRouter(document, {
      operations: {
        hello: (parameters) => ({
          status: 200,
          content: {
            'application/json': {
              message: `Hello ${parameters?.path?.name ?? ''}`
            }
          }
        })
      }
    })
  })
  describe('executableOpenAPIExpressHandler', () => {
    test('it serves execution result', async () => {
      const app = express()
      app.use(executableOpenAPIExpressHandler({
        execute
      }))
      const { body } = await supertest(app)
        .get('/hello/maxime')
        .expect(200)
      expect(body.message).toEqual('Hello maxime')
    })

    test('it mounts on other base path', async () => {
      const app = express()
      app.use('/api', executableOpenAPIExpressHandler({
        execute
      }))
      const { body } = await supertest(app)
        .get('/api/hello/maxime')
        .expect(200)
      expect(body.message).toEqual('Hello maxime')
    })

    test('it passes to next middleware if `execute` return null', async () => {
      execute = async () => null
      const app = express()
      app.use(executableOpenAPIExpressHandler({
        execute
      }))
      app.use((_req, res) => {
        res.status(440).send('Fooo')
      })
      await supertest(app)
        .get('/other')
        .expect(440)
    })

    test('it serves requested content type if available', async () => {
      const app = express()
      app.use(executableOpenAPIExpressHandler({
        execute
      }))
      await supertest(app)
        .get('/hello/maxime')
        .accept('application/*')
        .expect(200)
    })
    test('it returns 406 if requested content type is not available', async () => {
      const app = express()
      app.use(executableOpenAPIExpressHandler({
        execute
      }))
      await supertest(app)
        .get('/hello/maxime')
        .accept('application/xml')
        .expect(406)
    })
    test('it calls a provided `formater`', async () => {
      const app = express()
      app.use(executableOpenAPIExpressHandler({
        execute,
        format: {
          'application/json': (content) => ({
            // @ts-expect-error
            ...content,
            foo: 'bar'
          })
        }
      }))
      const { body } = await supertest(app)
        .get('/hello/maxime')
        .expect(200)
      expect(body.foo).toEqual('bar')
    })
    test('it calls security handlers and passes the result', async () => {
      const app = express()
      execute = jest.fn(async () => null)
      const basicHandler = jest.fn(() => ['admin'])
      app.use(executableOpenAPIExpressHandler({
        execute,
        security: {
          basic: basicHandler
        }
      }))
      await supertest(app)
        .get('/hello/maxime')

      expect(basicHandler).toHaveBeenCalled()
      // @ts-expect-error
      expect(execute.mock.calls[0][0].securities).toMatchObject({
        basic: ['admin']
      })
    })
    test.todo('it calls context function')
    test.todo('passes the query')
  })
})
