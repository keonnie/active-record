import { jest } from '@jest/globals'

await import('../__mocks__/mongodb')
const { Transaction } = await import('.')

describe('Unit | Transaction', () => {
  class Model {}

  let mockFind = jest.fn()
  let mockClient = { find: mockFind }
  let transaction = new Transaction(mockClient, Model)

  beforeAll(() => {
    mockFind.mockResolvedValue({
      key: 'test',
      value: 'test',
    })
  })

  afterEach(() => {
    mockFind.mockClear()
  })

  describe('> table', () => {
    test('return plurial of model name', () => {
      expect(transaction.table).toBe('models')
    })
  })

  describe('> find', () => {
    test('it return instance of model', async () => {
      let obj = await transaction.find()
      expect(obj).toBeInstanceOf(Model)
    })

    test('it call "find" from the client', async () => {
      let args = { test: 'test' }
      await transaction.find(args)
      expect(mockFind).toHaveBeenCalledWith(transaction.table, args)
    })

    test('it call model with params', async () => {
      let args = { test: 'test' }
      let dbresult = { ...args, id: 1, value: 1 }
      let mockModel = jest.fn().mockImplementation(() => {
        return {}
      })

      mockFind.mockResolvedValue(dbresult)
      let transaction2 = new Transaction(mockClient, mockModel)
      await transaction2.find(args)

      expect(mockModel).toHaveBeenCalledWith(dbresult)
    })

    test('it return null if not found', async () => {
      let args = { test: 'test' }
      let dbresult = null
      let mockModel = jest.fn().mockImplementation(() => {
        throw new Error('Should not construct')
      })

      mockFind.mockResolvedValue(dbresult)
      let transaction2 = new Transaction(mockClient, mockModel)
      let result = await transaction2.find(args)

      expect(result).toBeNull()
    })
  })
})
