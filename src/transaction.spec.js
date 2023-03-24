import { jest } from '@jest/globals'

await import('../__mocks__/mongodb')
const { Transaction } = await import('.')

describe('Unit | Transaction', () => {
  class Model {
    set id(id) {
      this._id = id
    }
    get id() {
      return this._id
    }

    get name() {
      return 'test'
    }
  }

  let mockFind = jest.fn()
  let mockFirstOrCreate = jest.fn()
  let mockInsert = jest.fn()
  let mockClient = {
    find: mockFind,
    first_or_create: mockFirstOrCreate,
    insert: mockInsert,
  }

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
    it('return plurial of model name', () => {
      expect(transaction.table).toBe('models')
    })

    it('return name of the class', () => {
      let t_model = new Transaction(mockClient, new Model())
      expect(t_model.table).toBe('models')
    })
  })

  describe('> find', () => {
    it(' return instance of model', async () => {
      let obj = await transaction.find()
      expect(obj).toBeInstanceOf(Model)
    })

    it(' call "find" from the client', async () => {
      let args = { test: 'test' }
      await transaction.find(args)
      expect(mockFind).toHaveBeenCalledWith(transaction.table, args)
    })

    it(' call model with params', async () => {
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

    it(' return null if not found', async () => {
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

  describe('> first_or_create', () => {
    it(' return instance of model', async () => {
      let obj = await transaction.first_or_create()
      expect(obj).toBeInstanceOf(Model)
    })

    it(' call "first_or_create" from the client', async () => {
      let query = { test: 'test' }
      let update = { name: 'tester' }
      await transaction.first_or_create(query, update)
      expect(mockFirstOrCreate).toHaveBeenCalledWith(
        transaction.table,
        query,
        update,
      )
    })

    it(' call model with params', async () => {
      let query = { test: 'test' }
      let update = { name: 'tester' }
      let dbresult = {
        value: { ...query, ...update, _id: '641d5684dec5bdb0bb6013be' },
      }
      let mockModel = jest.fn().mockImplementation(() => {
        return {}
      })

      mockFirstOrCreate.mockResolvedValue(dbresult)
      let transaction2 = new Transaction(mockClient, mockModel)
      await transaction2.first_or_create(query, update)

      expect(mockModel).toHaveBeenCalledWith(dbresult.value)
    })
  })

  describe('> insert', () => {
    it(' return instance of model', async () => {
      let insertedId = 10
      mockInsert.mockResolvedValue({
        acknowledged: true,
        insertedId,
      })

      let instance = new Model()
      let t = new Transaction(mockClient, instance)
      let obj = await t.insert()
      expect(obj).toBeInstanceOf(Model)
      expect(instance.id).toEqual(insertedId)
    })
  })
})
