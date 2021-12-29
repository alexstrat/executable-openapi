import { OperationExecutionRequest } from 'executable-openapi-types'

export class OperationExecutionRequestBuilder {
  private request: Partial<OperationExecutionRequest> = {}

  get (path: string): this {
    this.request = {
      ...this.request,
      method: 'get' as const,
      path
    }
    return this
  }

  put (path: string): this {
    this.request = {
      ...this.request,
      method: 'put' as const,
      path
    }
    return this
  }

  post (path: string): this {
    this.request = {
      ...this.request,
      method: 'post' as const,
      path
    }
    return this
  }

  delete (path: string): this {
    this.request = {
      ...this.request,
      method: 'delete' as const,
      path
    }
    return this
  }

  options (path: string): this {
    this.request = {
      ...this.request,
      method: 'options' as const,
      path
    }
    return this
  }

  head (path: string): this {
    this.request = {
      ...this.request,
      method: 'head' as const,
      path
    }
    return this
  }

  patch (path: string): this {
    this.request = {
      ...this.request,
      method: 'patch' as const,
      path
    }
    return this
  }

  trace (path: string): this {
    this.request = {
      ...this.request,
      method: 'trace' as const,
      path
    }
    return this
  }

  query (query: {
    [queryName: string]: string
  }): this {
    this.request = {
      ...this.request,
      query
    }
    return this
  }

  send (content: unknown): this
  send (mediaType: string, content: unknown): this
  send (mediaType: string | unknown, content?: unknown): this {
    if (typeof mediaType === 'object') {
      this.request.body = {
        mediaType: 'application/json',
        content: mediaType
      }
      return this
    }
    if (typeof mediaType !== 'string') {
      throw new TypeError('Expected a string as media type')
    }
    if (content === undefined) {
      throw new TypeError('Expected something as content')
    }

    this.request.body = {
      mediaType,
      content
    }

    return this
  }

  header (): never {
    throw new Error('Not implemented')
  }

  cookie (): never {
    throw new Error('Not implemented')
  }

  auth (securitySchemeName: string, scopes?: boolean | string[]): this
  auth (securities: { [securitySchemeName: string]: boolean | string[] }): this
  auth (
    securitiesOrSchemeName: { [securitySchemeName: string]: boolean | string[] } | string,
    scopes?: boolean | string[]
  ): this {
    if (typeof securitiesOrSchemeName === 'string') {
      this.request.securities = {
        ...this.request.securities,
        [securitiesOrSchemeName]: scopes === undefined ? true : scopes
      }
    } else {
      this.request.securities = securitiesOrSchemeName
    }

    return this
  }

  build (): OperationExecutionRequest {
    if (this.request.method === undefined || this.request.path === undefined) {
      throw new Error('Empty request: forgot to call `get`, `post`..?')
    }
    return this.request as OperationExecutionRequest
  }
}
