import { jest } from '@jest/globals'
import { ObjectId } from 'mongodb'
import AbstractDBFacade from './abstract-db-facade'

const __mockGetEncryptionSettings = jest.fn()
jest.unstable_mockModule('../mongo-db/encryption', () => ({
  getEncryptionSettings: __mockGetEncryptionSettings,
}))

const {
  MongoClient,
  __mockConnect,
  __mockClose,
  __mockFindOne,
  __mockFindOneAndUpdate,
  __mockInsertOne,
} = await import('../../__mocks__/mongodb')
await import('../mongo-db/encryption')

const MONGODB_FIND_OR_UPDATE_OPTIONS = {
  upsert: true,
  returnDocument: 'after',
  returnNewDocument: true,
}

const dbname = 'dbname'

const CONNECTION_PARAMS = Object.freeze([
  'username',
  'password',
  'cluster',
  dbname,
  { autoEncryption: false },
])

const CONNECTION_PARAMS_SECURE = Object.freeze([
  'username',
  'password',
  'cluster',
  dbname,
  { autoEncryption: true },
])

const { default: MongoDBFacade } = await import('./mongodb-facade')

describe('Unit | MongoDBFacade', () => {
  afterEach(() => {
    __mockConnect.mockClear()
    __mockClose.mockClear()
    __mockFindOne.mockClear()
    __mockFindOneAndUpdate.mockClear()
    __mockInsertOne.mockClear()

    MongoClient.mockClear()
  })

  describe('when connecting', () => {
    it('instanciate and connect', async () => {
      let instance = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      expect(__mockConnect).toHaveBeenCalled()
      expect(instance).toBeDefined()
      expect(instance).toBeInstanceOf(AbstractDBFacade)
    })

    it('instance of AbstractDBFacade', () => {
      expect(new MongoDBFacade(...CONNECTION_PARAMS)).toBeInstanceOf(
        AbstractDBFacade,
      )
    })

    it('build mongodb connection string', async () => {
      const [username, password, cluster, dbname] = CONNECTION_PARAMS

      const instance = new MongoDBFacade(...CONNECTION_PARAMS)
      await instance.connect()
      expect(MongoClient).toHaveBeenCalledWith(
        `mongodb+srv://${username}:${password}@${cluster}/${dbname}?retryWrites=true&w=majority`,
        expect.objectContaining({
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }),
      )
    })

    it('call MongoClient#connect on connect', async () => {
      MongoDBFacade.connect(...CONNECTION_PARAMS)
      expect(__mockConnect).toHaveBeenCalled()
    })
  })

  describe('when closing', () => {
    it('call MongoClient#close on close', async () => {
      let instance = new MongoDBFacade(...CONNECTION_PARAMS)
      await instance.connect()
      await instance.close()
      expect(__mockClose).toHaveBeenCalled()
    })
  })

  describe('when calling `find`', () => {
    it('require collection name', async () => {
      let f = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      await expect(f.find(null, {})).rejects.toThrow(TypeError)
    })

    it('require argument to be an object', async () => {
      let f = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      await expect(f.find('users', null)).rejects.toThrow(TypeError)
    })

    it('call find from mongodbclient with parsed arguments', async () => {
      let account = {
        name: 'abc',
        password: 'def',
      }

      let f = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      await f.find('accounts', account)

      expect(__mockFindOne).toHaveBeenCalledWith({
        name: { $eq: account.name },
        password: { $eq: account.password },
      })
    })
  })

  describe('when first or create', () => {
    it('merge query and update on insert', async () => {
      let query = { name: 'test' }
      let update = { extra: 'tester' }

      let f = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      await f.first_or_create('test', query, update)

      expect(__mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining(query),
        { $setOnInsert: { ...query, ...update } },
        MONGODB_FIND_OR_UPDATE_OPTIONS,
      )
    })

    it('call findOneAndUpdate with required options', async () => {
      let query = { name: 'test' }
      let update = { extra: 'tester' }

      let f = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      await f.first_or_create('test', query, update)

      expect(__mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining(query),
        { $setOnInsert: expect.objectContaining(update) },
        MONGODB_FIND_OR_UPDATE_OPTIONS,
      )
    })

    it('call findOneAndUpdate with query data if update empty', async () => {
      let query = { name: 'test' }

      let f = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      await f.first_or_create('test', query)

      expect(__mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining(query),
        { $setOnInsert: query },
        MONGODB_FIND_OR_UPDATE_OPTIONS,
      )
    })

    it(' convert _id into string', async () => {
      let query = { name: 'test' }
      let _id = new ObjectId()

      __mockFindOneAndUpdate.mockResolvedValue({
        value: { ...query, _id },
      })
      let f = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      let result = await f.first_or_create('test', query)
      expect(result.value._id).toBe(_id.toString())
    })
  })

  describe('when inserting', () => {
    it('call insertOne when single object', async () => {
      let f = await MongoDBFacade.connect(...CONNECTION_PARAMS)
      await f.insert('data', { value: '' })

      expect(__mockInsertOne).toHaveBeenCalled()
    })
  })

  describe('with Field Level Encryption (FLE)', () => {
    const encryptionSettings = {
      autoEncryption: {
        keyVaultNamespace: 'dbname-vault.__default',
        kmsProviders: {
          gcp: {
            email: 'service@iam.com',
            privateKey: 'abc123',
          },
        },
        schemaMap: {},
      },
    }

    beforeAll(() => {
      __mockGetEncryptionSettings.mockResolvedValue(encryptionSettings)
    })

    it('skip if autoEncryption not defined', async () => {
      let local_settings = ['username', 'password', 'cluster', dbname]
      await MongoDBFacade.connect(...local_settings)
      expect(__mockGetEncryptionSettings).not.toHaveBeenCalled()
    })

    it('skip if encryption disabled', async () => {
      await MongoDBFacade.connect(...CONNECTION_PARAMS)
      expect(__mockGetEncryptionSettings).not.toHaveBeenCalled()
    })

    it('provide encryption params', async () => {
      await MongoDBFacade.connect(...CONNECTION_PARAMS_SECURE)
      expect(__mockGetEncryptionSettings).toHaveBeenCalled()
    })

    it('include auto encryption settings', async () => {
      await MongoDBFacade.connect(...CONNECTION_PARAMS_SECURE)
      expect(MongoClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining(encryptionSettings),
      )
    })
  })
})
