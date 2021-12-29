/**
 * A function that'll execute an operation described by an OpenAPI
 * document and return the result of the execution.
 *
 * If the result is `null`, the operation is not in the
 * service realm. In this case, the server implementing the service should
 * probably returns a 404.
 *
 * The execute function can accept a `context` argument that'll be passed to
 * all operation handlers.
 */
export type ExecuteOperation<TExecutionContext> =
  TExecutionContext extends undefined ?
      (req: OperationExecutionRequest) => Promise<ExcecuteOperationResult> :
      (req: OperationExecutionRequest, context: TExecutionContext) => Promise<ExcecuteOperationResult>

export interface OperationExecutionRequestBody {
  /**
   * The media-type of the request body.
   */
  mediaType: string
  /**
   * The content of the request body.
   */
  content: unknown
}

/**
 * A request for executing an operation that can be
 * consumed by [[ExecuteOperation]].
 * It is an representation of an HTTP request.
 */
export interface OperationExecutionRequest {
  /**
   * The requested path.
   *
   * Should not contain the query string part.
   */
  path: string

  /**
   * The HTTP method.
   */
  method: HTTPRequestMethod

  /**
   * The query part of the request.
   *
   * This typing corresponds to what `qs` (used by default `express`)
   * would give us in the most generic case.
   * in future: for support of less usual query paramters formatting, we may need to
   * pass directly string here and do the parsing inside the middleware
   */
  query?: {
    [queryName: string]: unknown
  }

  /**
   * The headers of the request.
   */
  headers?: {
    [headerName: string]: string | string[] | undefined
  }

  /**
   * The cookies ofthe request.
   */
  cookies?: {
    [cookieName: string]: string
  }

  /**
   * The body of the request if any.
   */
  body?: OperationExecutionRequestBody

  /**
   * The security schemes this request has been authenticated against.
   *
   * If the security scheme accept scopes, it includes the scopes of the
   * authenticated user.
   *
   * @example
   * ```
   * securities: {
   *   api_key: true,
   *   petstore_auth: ['write:pets']
   * }
   * ```
   */
  securities?: {
    [securitySchemeName: string]: boolean | string[]
  }
}

export type HTTPRequestMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'

/**
 * A response after execution.
 *
 * This will be translated in an HTTP response.
 */
export interface OperationExecutionResponse {
  /**
   * The HTTP status code of the response.
   */
  status: number

  /**
   * The headers of the response.
   */
  headers?: {
    [headerName: string]: string
  }

  /**
   * The content of the response with its media type.
   *
   * Can contain several keys for each response media type supported
   * by the service.
   * The response content media type negotation should be done by the
   * server.
   */
  content?: {
    [mediaType: string]: unknown
  }
}

export type ExcecuteOperationResult = OperationExecutionResponse | null
