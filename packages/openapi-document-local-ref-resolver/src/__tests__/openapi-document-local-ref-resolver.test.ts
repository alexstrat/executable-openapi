import { OpenAPIObject } from 'openapi3-ts'
import { localRefResolver } from '..'

const document: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Example API',
    version: '1'
  },
  components: {
    schemas: {
      User: {
        properties: {
          id: {
            type: 'integer'
          },
          name: {
            type: 'string'
          }
        }
      }
    }
  },
  paths: {
  }
}

describe('openapi-document-local-ref-resolver', () => {
  it('resolves local', async () => {
    const resolve = localRefResolver(document)
    const resolved = await resolve('#/components/schemas/User')
    expect(resolved).toMatchObject({
      properties: {
        id: {
          type: 'integer'
        },
        name: {
          type: 'string'
        }
      }
    })
  })
})
