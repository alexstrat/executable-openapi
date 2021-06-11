---
to: packages/<%=name%>/src/__tests__/<%=name%>.test.ts
---
import { foo } from '..'

describe('<%=name%>', () => {
  it('needs tests', () => {
    expect(foo).toEqual('🦄 Hello you !')
  })
})
