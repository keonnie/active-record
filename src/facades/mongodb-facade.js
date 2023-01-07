import { MongoClient } from 'mongodb'
import AbstractDBFacade from './abstract-db-facade'

/**
 * Facade for MongoDBFacade
 * Recommend to instanciate with the `connect` factory
 * MongoDBFacade.connect(username, password, cluster, dbname)
 */
export default class MongoDBFacade extends AbstractDBFacade {
  /**
   * Create an instance of MongoDBFacade
   * and establish the connection
   * @param {String} username
   * @param {String} password
   * @param {String} cluster
   * @param {String} dbname
   * @returns {MongoDBFacade} Instance of MongoDBFacade
   */
  static async connect() {
    let instance = new MongoDBFacade(...arguments)
    await instance.connect()
    return instance
  }

  // PRIVATE
  #client

  /**
   * Constructor
   * @param {String} username
   * @param {String} password
   * @param {String} cluster
   * @param {String} dbname
   * @returns {MongoDBFacade} Facade for mongodb
   */
  constructor(username, password, cluster, dbname) {
    super()
    this.#client = new MongoClient(
      `mongodb+srv://${username}:${password}@${cluster}/${dbname}?retryWrites=true&w=majority`,
    )
  }

  /**
   * Establish a connection
   */
  async connect() {
    await this.#client.connect()
  }

  /**
   * Close database connection
   */
  async close() {
    await this.#client.close()
  }

  /**
   * Find the first matching arguments
   * provided
   * @param {String} collection
   * @param {String} args
   * @returns
   */
  async find(collection, args) {
    let table = await this.#client.db().collection(collection)
    return table.findOne(args)
  }
}
