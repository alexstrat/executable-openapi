import { pathConcretenessCompareFunction } from '../utils'

describe('pathConcretenessCompareFunction', () => {
  test('easy case', () => {
    expect(pathConcretenessCompareFunction('/user/{id}', '/user/foo')).toEqual(3)
    expect(pathConcretenessCompareFunction('/user/foo', '/user/{id}')).toEqual(-3)
  })
  test('nested', () => {
    expect(pathConcretenessCompareFunction('/user/{id}/orders/{id}', '/user/{id}/orders/foo')).toEqual(3)
  })
  test('equality', () => {
    expect(pathConcretenessCompareFunction('/user/{userId}', '/user/{id}')).toEqual(0)
  })

  test('sort', () => {
    expect(
      [
        '/user/{id}',
        '/user/foo'
      ].sort(pathConcretenessCompareFunction)
    ).toMatchObject([
      '/user/foo',
      '/user/{id}'
    ])
  })
})
