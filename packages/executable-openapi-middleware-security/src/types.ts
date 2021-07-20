import { OperationExecutionResponse } from 'executable-openapi-types'
import { Request, OperationInfo } from 'executable-openapi-router'

export interface ExecutableOpenAPIMiddlewareSecurity<TExecutionContext> {
  /**
   * Use this to customize the response sent when the request does
   * not meet the security requirements.
   */
  forbiddenResponse?: (
    schemeResults: { [schemeName: string]: string },
    req: Request,
    context: TExecutionContext,
    info: OperationInfo
  ) => OperationExecutionResponse | Promise<OperationExecutionResponse>
}
