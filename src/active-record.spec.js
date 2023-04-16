import { jest } from '@jest/globals'

await import('../__mocks__/mongodb-dependencies')
const { Database } = await import('.')
const { default: ActiveRecord } = await import('./active-record')

class Model extends ActiveRecord {
  static __primaryKey = ['id', 'key1', 'key2']
  static __timestamp = true

  _nogetter = ''

  set custom(value) {
    if (isNaN(value)) throw new TypeError()
    this._custom = value
  }
  get custom() {
    return this._custom
  }
}

class NoPrimary extends ActiveRecord {
  static __primaryKey = null
}

class StringPrimary extends ActiveRecord {
  static __primaryKey = 'id'
}

class WrongPrimary extends ActiveRecord {
  static __primaryKey = {}
}

class NoTimeStamp extends ActiveRecord {
  static __primaryKey = ['id']
}

describe('Unit | ActiveRecord', () => {
  let spyTransaction = null
  let mockFind = jest.fn()
  let mockFirstOrCreate = jest.fn()
  let mockInsert = jest.fn()

  beforeAll(() => {
    spyTransaction = jest.spyOn(Database, 'createTransaction')
    spyTransaction.mockReturnValue({
      find: mockFind,
      first_or_create: mockFirstOrCreate,
      insert: mockInsert,
    })
  })

  afterEach(() => {
    spyTransaction?.mockClear()
    mockInsert.mockReset()
    mockFind.mockReset()
    mockFirstOrCreate.mockReset()
  })

  describe('when instantiating', () => {
    it('prevent to instantiate ActiveRecord directly', () => {
      expect(() => new ActiveRecord()).toThrow(TypeError)
    })

    it('allow without any params', () => {
      expect(() => new Model()).not.toThrow(TypeError)
    })

    it('bind parameters to the model', () => {
      let attrs = { name: 'test', value: 'test' }
      let model = new Model(attrs)
      expect(model.name).toBe(attrs.name)
      expect(model.value).toBe(attrs.value)
    })

    describe('run primary key validation', () => {
      it('throw if invalid primary key', () => {
        expect(() => new WrongPrimary()).toThrow(TypeError)
      })

      it('allow primary keys to be a string', () => {
        expect(() => new StringPrimary()).not.toThrow(TypeError)
      })

      it('allow no primary key by defining `null`', () => {
        expect(() => new NoPrimary()).not.toThrow(TypeError)
      })
    })
  })

  describe('when validating', () => {
    it('run validation through setter', () => {
      expect(() => new Model({ custom: 'text' })).toThrow(TypeError)
    })
  })

  describe('when getting id', () => {
    it('return id if defined', () => {
      let model = new Model({ _id: '123' })
      expect(model.id).toBeDefined()
    })

    it('returns undefined if not defined', () => {
      let model = new Model({ test: '123' })
      expect(model.id).toBeUndefined()
    })
  })

  describe('when searching record', () => {
    it('creates transaction object from database', () => {
      let search = { test: 'test' }
      ActiveRecord.find(search)
      expect(spyTransaction).toHaveBeenCalledWith(ActiveRecord)
    })

    it('calls find from transaction', () => {
      let search = { test: 'test' }
      ActiveRecord.find(search)
      expect(mockFind).toHaveBeenCalledWith(search)
    })
  })

  describe('when creating a record from `create`', () => {
    it('creates and save the record', async () => {
      let data = { test: 'test' }
      await Model.create(data)
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining(data))
    })

    it('creates and save the record for inherited class', async () => {
      let data = { test: 'test' }
      let model = await Model.create(data)
      expect(model).toBeInstanceOf(Model)
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining(data))
    })

    it('creates without any params', async () => {
      let model = await Model.create()
      expect(model).toBeInstanceOf(Model)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      )
    })
  })

  describe('when newing a record from `new`', () => {
    it('creates an instance without saving', async () => {
      let data = { test: 'test' }
      let model = Model.new(data)
      expect(model).toBeInstanceOf(Model)
      expect(mockInsert).not.toHaveBeenCalledWith(data)
    })

    it('creates an instance of inherited class without saving', async () => {
      let data = { test: 'test' }
      let model = Model.new(data)
      expect(model).toBeInstanceOf(Model)
      expect(mockInsert).not.toHaveBeenCalledWith(data)
    })

    it('creates an instance without any params', async () => {
      let model = Model.new()
      expect(model).toBeInstanceOf(Model)
    })
  })

  describe('when saving', () => {
    it('creates transaction object from database', async () => {
      let data = { test: 'test' }
      let model = new Model(data)
      await model.save()
      expect(spyTransaction).toHaveBeenCalledWith(expect.any(Model))
    })

    it('calls insert if any of the primary keys are defined', async () => {
      let data = { test: 'test' }
      let model = new Model(data)
      await model.save()
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining(data))
    })

    it('includes only property with getter or public', async () => {
      let data = { custom: 10 }
      let model = new Model(data)
      await expect(model.save()).resolves.toBe(true)

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      )
    })

    it('calls `firstOrCreate` if all primary keys are defined', async () => {
      let keys = { id: '123', key1: 1234, key2: '12345' }
      let data = { name: 'test' }

      let model = new Model({ ...keys, ...data })
      await expect(model.save()).resolves.toBe(true)

      expect(mockFirstOrCreate).toHaveBeenCalledWith(keys, {
        ...data,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      })
    })

    it('returns false if failed to save', async () => {
      mockInsert.mockRejectedValue(new TypeError())
      let data = { name: 'test' }
      let model = new Model(data)
      await expect(model.save()).resolves.toBe(false)
    })

    it('inserts if no primary key defined', async () => {
      let data = { name: 'test' }
      let model = new NoPrimary(data)
      await expect(model.save()).resolves.toBe(true)

      expect(mockInsert).toHaveBeenCalled()
    })

    it('detects primary key declared as string', async () => {
      let keys = { id: 'abc123' }
      let data = { name: 'test' }
      let model = new StringPrimary({ ...keys, ...data })
      await expect(model.save()).resolves.toBe(true)

      expect(mockFirstOrCreate).toHaveBeenCalledWith(keys, data)
    })
  })

  describe('when searching with `first_or_create`', () => {
    it('creates transaction object from database', () => {
      let search = { test: 'test' }
      let update = { name: 'tester' }
      Model.first_or_create(search, update)
      expect(spyTransaction).toHaveBeenCalledWith(Model)
    })

    it('calls `first_or_create` from transaction', () => {
      let search = { test: 'test' }
      let update = { name: 'tester' }
      Model.first_or_create(search, update)
      expect(mockFirstOrCreate).toHaveBeenCalledWith(
        search,
        expect.objectContaining({
          ...update,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      )
    })

    it('throw error if not passing validation', async () => {
      let search = { custom: 'test' }
      let update = { name: 'tester' }
      await expect(() => Model.first_or_create(search, update)).rejects.toThrow(
        Error,
      )
    })

    it('does not include timestamp if not enabled', () => {
      let search = { test: 'test' }
      let update = { name: 'tester' }
      NoTimeStamp.first_or_create(search, update)
      expect(mockFirstOrCreate).toHaveBeenCalledWith(search, update)
    })
  })

  describe('with timestamp', () => {
    describe('when disabled', () => {
      it('return `undefined` for timestamp properties', () => {
        let model = new NoTimeStamp()
        expect(model.createdAt).toBeUndefined()
        expect(model.updatedAt).toBeUndefined()
      })

      it('does not include `createdAt` when saving', async () => {
        let data = { test: 'test' }
        let model = new NoTimeStamp(data)
        await model.save()

        expect(mockInsert).toHaveBeenCalledWith(
          expect.not.objectContaining({
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
          }),
        )
      })
    })

    describe('when enabled', () => {
      it('returns date for timestamp properties via getter', () => {
        let model = new Model()
        expect(model.createdAt).toBeDefined()
        expect(model.updatedAt).toBeDefined()
      })

      it('includes `createdAt` property', async () => {
        let data = { name: 'test' }
        let model = new Model(data)
        await model.save()

        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
          }),
        )
      })

      it('does not change `createdAt` when already set', async () => {
        let createdAt = new Date(2023, 1, 1).getTime()
        let data = { name: 'test', createdAt }
        let model = new Model(data)
        await model.save()

        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({ createdAt }),
        )
      })

      it('does not change `updatedAt` when already set', async () => {
        let updatedAt = new Date(2023, 1, 1).getTime()
        let data = { name: 'test', updatedAt }
        let model = new Model(data)
        await model.save()

        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({ updatedAt }),
        )
      })
    })
  })
})
