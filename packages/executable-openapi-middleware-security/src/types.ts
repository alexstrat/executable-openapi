import { OperationExecutionResponse, OperationInfo, Body, Parameters } from 'executable-openapi-types'

export interface ExecutableOpenAPIMiddlewareSecurity<TExecutionContext> {
  /**
   * Use this to customize the response sent when the request does
   * not meet the security requirements.
   */
  forbiddenResponse?: (
    schemeResults: { [schemeName: string]: string },
    paramters: Parameters,
    body: Body,
    context: TExecutionContext,
    info: OperationInfo
  ) => OperationExecutionResponse | Promise<OperationExecutionResponse>
}
