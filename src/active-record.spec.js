import { jest } from '@jest/globals'

await import('../__mocks__/mongodb')
const { Database } = await import('.')
const { default: ActiveRecord } = await import('./active-record')

describe('Unit | ActiveRecord', () => {
  test('allow construct without any param', () => {
    expect(() => new ActiveRecord()).not.toThrow(TypeError)
  })

  test('bind parameters to the model', () => {
    let attrs = { name: 'test', value: 'test' }
    let model = new ActiveRecord(attrs)
    expect(model.name).toBe(attrs.name)
    expect(model.value).toBe(attrs.value)
  })

  describe('when searching record', () => {
    let spyTransaction = null
    let mockFind = jest.fn()

    beforeAll(() => {
      spyTransaction = jest.spyOn(Database, 'createTransaction')
      spyTransaction.mockReturnValue({
        find: mockFind,
      })
    })

    afterEach(() => {
      spyTransaction?.mockClear()
    })

    test('it create transaction object from database', () => {
      let search = { test: 'test' }
      ActiveRecord.find(search)
      expect(spyTransaction).toHaveBeenCalledWith(ActiveRecord)
    })

    test('it call find from transaction', () => {
      let search = { test: 'test' }
      ActiveRecord.find(search)
      expect(mockFind).toHaveBeenCalledWith(search)
    })
  })
})
