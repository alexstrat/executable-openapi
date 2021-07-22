import { ExcecuteOperationResult, ExecuteOperation } from 'executable-openapi-types'
import { OperationExecutionRequestBuilder } from './request'

export class OperationExecutionAgent<TExecutionContext> extends OperationExecutionRequestBuilder implements Promise<ExcecuteOperationResult> {
  private maybeExecutionResult?: Promise<ExcecuteOperationResult>
  private executionContext?: TExecutionContext

  constructor (
    private readonly execute: ExecuteOperation<TExecutionContext>
  ) {
    super()
  }

  [Symbol.toStringTag]: string

  async end (): Promise<ExcecuteOperationResult> {
    if (this.maybeExecutionResult === undefined) {
      this.maybeExecutionResult = this.execute(this.build(), this.executionContext as TExecutionContext)
    }
    return await this.maybeExecutionResult
  }

  context (ctx: TExecutionContext): this {
    this.executionContext = ctx
    return this
  }

  async then<TResult1 = ExcecuteOperationResult, TResult2 = never>(
    onfulfilled?: ((value: ExcecuteOperationResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return await this.end().then(onfulfilled, onrejected)
  }

  async catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<ExcecuteOperationResult | TResult> {
    return await this.end().catch(onrejected)
  }

  async finally (onfinally?: (() => void) | null): Promise<ExcecuteOperationResult> {
    return await this.end().finally(onfinally)
  }
}
