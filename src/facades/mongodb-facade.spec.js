import AbstractDBFacade from './abstract-db-facade'

const { MongoClient, __mockConnect, __mockClose, __mockFindOne } = await import(
  '../../__mocks__/mongodb'
)
const { default: MongoDBFacade } = await import('./mongodb-facade')

describe('Unit | MongoDBFacade', () => {
  afterEach(() => {
    __mockConnect.mockClear()
    __mockClose.mockClear()
    __mockFindOne.mockClear()
  })

  test('instanciate and connect', async () => {
    let instance = await MongoDBFacade.connect()
    expect(__mockConnect).toHaveBeenCalled()
    expect(instance).toBeDefined()
    expect(instance).toBeInstanceOf(AbstractDBFacade)
  })

  test('instance of AbstractDBFacade', () => {
    expect(new MongoDBFacade()).toBeInstanceOf(AbstractDBFacade)
  })

  test('build mongodb connection string', () => {
    let username = 'user'
    let password = 'pass'
    let cluster = 'clustername.mongodb.net'
    let dbname = 'test'

    new MongoDBFacade(username, password, cluster, dbname)
    expect(MongoClient).toHaveBeenCalledWith(
      `mongodb+srv://${username}:${password}@${cluster}/${dbname}?retryWrites=true&w=majority`,
    )
  })

  test('call MongoClient#connect on connect', async () => {
    MongoDBFacade.connect()
    expect(__mockConnect).toHaveBeenCalled()
  })

  test('call MongoClient#close on close', async () => {
    let instance = new MongoDBFacade()
    await instance.close()
    expect(__mockClose).toHaveBeenCalled()
  })

  test('call find from mongodbclient', async () => {
    let f = new MongoDBFacade()
    await f.find()

    expect(__mockFindOne).toHaveBeenCalled()
  })
})
