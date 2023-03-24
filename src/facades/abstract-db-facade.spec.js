import AbstractDBFacade from './abstract-db-facade'

class FakeFacade extends AbstractDBFacade {}

describe('Unit | AbstractDBFacade', () => {
  it('cannot instanciate directly', () => {
    expect(() => new AbstractDBFacade()).toThrow(
      Error('`AbstractDBFacade` cannot be instanciated directly.'),
    )
  })

  it('inherit can be instanciated', () => {
    expect(() => new FakeFacade()).not.toThrow()
  })

  it('has `close` method', () => {
    expect(AbstractDBFacade.prototype.close).toBeInstanceOf(Function)
  })
})
