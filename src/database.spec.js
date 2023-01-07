import { jest } from '@jest/globals'
import AbstractDBFacade from './facades/abstract-db-facade'

jest.unstable_mockModule('./transaction', () => ({
  default: jest.fn().mockImplementation(() => {
    return {}
  }),
}))

await import('../__mocks__/mongodb')
const { ActiveRecord, Database, Transaction } = await import('.')

describe('Unit | Database', () => {
  class Facade1 extends AbstractDBFacade {}
  class Facade2 extends AbstractDBFacade {}
  class Model extends ActiveRecord {}

  afterEach(() => {
    Transaction.mockClear()
  })

  describe('> client', () => {
    test('passed by value', () => {
      Database.client = new Facade1()
      let firstClient = Database.client
      Database.client = new Facade2()
      let seconclient = Database.client

      expect(firstClient).toBeInstanceOf(Facade1)
      expect(seconclient).toBeInstanceOf(Facade2)
    })
  })

  describe('> createTransaction', () => {
    test('model must be provided', () => {
      expect(() => Database.createTransaction()).toThrow(
        new Error('Model must be provided.'),
      )
    })

    test('model is instance of ActiveRecord', () => {
      expect(() => Database.createTransaction(class Test {})).toThrow(
        new Error('Model must be an instance of ActiveRecord.'),
      )
    })

    test('provide database and table name', () => {
      Database.createTransaction(Model)
      expect(Transaction).toHaveBeenCalledWith(
        expect.any(AbstractDBFacade),
        Model,
      )
    })
  })

  describe('> close', () => {
    test('call facade close method', async () => {
      let spyClose = jest.spyOn(Facade1.prototype, 'close')
      Database.client = new Facade1()
      Database.close()
      expect(spyClose).toHaveBeenCalled()
    })
  })
})
