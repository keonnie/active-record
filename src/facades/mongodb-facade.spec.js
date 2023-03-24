import { ObjectId } from 'mongodb'
import AbstractDBFacade from './abstract-db-facade'

const {
  MongoClient,
  __mockConnect,
  __mockClose,
  __mockFindOne,
  __mockFindOneAndUpdate,
  __mockInsertOne,
} = await import('../../__mocks__/mongodb')
const { default: MongoDBFacade } = await import('./mongodb-facade')

const MONGODB_FIND_OR_UPDATE_OPTIONS = {
  upsert: true,
  returnDocument: 'after',
  returnNewDocument: true,
}

describe('Unit | MongoDBFacade', () => {
  afterEach(() => {
    __mockConnect.mockClear()
    __mockClose.mockClear()
    __mockFindOne.mockClear()
    __mockFindOneAndUpdate.mockClear()
    __mockInsertOne.mockClear()
  })

  it('instanciate and connect', async () => {
    let instance = await MongoDBFacade.connect()
    expect(__mockConnect).toHaveBeenCalled()
    expect(instance).toBeDefined()
    expect(instance).toBeInstanceOf(AbstractDBFacade)
  })

  it('instance of AbstractDBFacade', () => {
    expect(new MongoDBFacade()).toBeInstanceOf(AbstractDBFacade)
  })

  it('build mongodb connection string', () => {
    let username = 'user'
    let password = 'pass'
    let cluster = 'clustername.mongodb.net'
    let dbname = 'test'

    new MongoDBFacade(username, password, cluster, dbname)
    expect(MongoClient).toHaveBeenCalledWith(
      `mongodb+srv://${username}:${password}@${cluster}/${dbname}?retryWrites=true&w=majority`,
      expect.objectContaining({
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    )
  })

  it('call MongoClient#connect on connect', async () => {
    MongoDBFacade.connect()
    expect(__mockConnect).toHaveBeenCalled()
  })

  it('call MongoClient#close on close', async () => {
    let instance = new MongoDBFacade()
    await instance.close()
    expect(__mockClose).toHaveBeenCalled()
  })

  describe('when calling `find`', () => {
    it('require collection name', async () => {
      let f = new MongoDBFacade()
      await expect(f.find(null, {})).rejects.toThrow(TypeError)
    })

    it('require argument to be an object', async () => {
      let f = new MongoDBFacade()
      await expect(f.find('users', null)).rejects.toThrow(TypeError)
    })

    it('call find from mongodbclient with parsed arguments', async () => {
      let account = {
        name: 'abc',
        password: 'def',
      }

      let f = new MongoDBFacade()
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

      let f = new MongoDBFacade()
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

      let f = new MongoDBFacade()
      await f.first_or_create('test', query, update)

      expect(__mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining(query),
        { $setOnInsert: expect.objectContaining(update) },
        MONGODB_FIND_OR_UPDATE_OPTIONS,
      )
    })

    it('call findOneAndUpdate with query data if update empty', async () => {
      let query = { name: 'test' }

      let f = new MongoDBFacade()
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
      let f = new MongoDBFacade()
      let result = await f.first_or_create('test', query)
      expect(result.value._id).toBe(_id.toString())
    })
  })

  describe('when inserting', () => {
    it('call insertOne when single object', async () => {
      let f = new MongoDBFacade()
      await f.insert('data', { value: '' })

      expect(__mockInsertOne).toHaveBeenCalled()
    })
  })
})
