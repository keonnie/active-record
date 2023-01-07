import AbstractDBFacade from './abstract-db-facade'

class FakeFacade extends AbstractDBFacade {}

describe('Unit | AbstractDBFacade', () => {
  test('cannot instanciate directly', () => {
    expect(() => new AbstractDBFacade()).toThrow(
      Error('`AbstractDBFacade` cannot be instanciated directly.'),
    )
  })

  test('inherit can be instanciated', () => {
    expect(() => new FakeFacade()).not.toThrow()
  })

  test('has `close` method', () => {
    expect(AbstractDBFacade.prototype.close).toBeInstanceOf(Function)
  })
})
