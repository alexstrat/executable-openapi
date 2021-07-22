import { ExecuteOperation } from 'executable-openapi-types'
import { request } from '..'

describe('executable-openapi-test-utils', () => {
  test('builds a request', () => {
    expect(request()
      .post('/foo')
      .query({ name: 'bar' })
      .send({ any: 'data' })
      .auth('basicAuth', ['admin'])
      .build())
      .toMatchInlineSnapshot(`
  Object {
    "body": Object {
      "application/json": Object {
        "any": "data",
      },
    },
    "method": "post",
    "path": "/foo",
    "query": Object {
      "name": "bar",
    },
    "securities": Object {
      "basicAuth": Array [
        "admin",
      ],
    },
  }
  `)
  })

  test('not thhrow when expect a correct status', async () => {
    const execute: ExecuteOperation<unknown> = async ({ query }) => ({
      status: 200,
      content: {
        // @ts-expect-error
        'application/json': query?.name
      }
    })
    const res = await request(execute)
      .get('/hello')
      .query({ name: 'world' })
      .expect(200)
    expect(res?.content?.['application/json']).toEqual('world')
  })

  test('throws when expected status not there', async () => {
    const execute: ExecuteOperation<unknown> = async () => ({
      status: 404
    })
    await expect(request(execute)
      .get('/hello')
      .query({ name: 'world' })
      .expect(200)
    ).rejects.toThrow('Expected "200", got "404"')
  })
})
