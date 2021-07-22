import { ExcecuteOperationResult } from 'executable-openapi-types'
import { OperationExecutionAgent } from './agent'

export class OperationExecutionTestAgent<TExecutionContext> extends OperationExecutionAgent<TExecutionContext> {
  private readonly assertions: Array<(res: ExcecuteOperationResult) => void> = []

  expect (status: number): this {
    this.assertions.push((res) => {
      if (res === null) {
        throw new Error(`Expected response with "${status}", got no response`)
      }
      if (res.status !== status) {
        throw new Error(`Expected "${status}", got "${res.status}"`)
      }
    })
    return this
  }

  private runAssertions (res: ExcecuteOperationResult): void {
    for (const assertion of this.assertions) {
      assertion(res)
    }
  }

  async end (): Promise<ExcecuteOperationResult> {
    const res = await super.end()

    this.runAssertions(res)

    return res
  }
}
