import { Unicorn } from '..'

describe('executable-openapi-types', () => {
  it('needs tests', () => {
    const unicorn = new Unicorn()
    expect(unicorn.sayHelloTo('you')).toEqual('🦄 Hello you !')
  })
})
