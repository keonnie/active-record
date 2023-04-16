import { MongoClient } from 'mongodb'

import AbstractDBFacade from './abstract-db-facade'
import { isBlank } from '../validators/string'
import { getEncryptionSettings } from '../mongo-db/encryption'

export const DEFAULT_CONNECTION = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  monitorCommands: true,
}

/**
 * Facade for MongoDBFacade
 * Recommend to instanciate with the `connect` factory
 * MongoDBFacade.connect(username, password, cluster, dbname)
 */
export default class MongoDBFacade extends AbstractDBFacade {
  /**
   * Create an instance of MongoDBFacade
   * and establish the connection
   *
   * @param {String} username
   * @param {String} password
   * @param {String} cluster
   * @param {String} dbname
   * @param {{
   *   autoEncryption: Boolean,
   *   kmsProviders: {
   *     gcp: {
   *       email: String,
   *       privateKey: String,
   *     }
   *   }
   * }} opts
   * @returns {MongoDBFacade} Facade for mongodb
   */
  static async connect() {
    let instance = new MongoDBFacade(...arguments)
    await instance.connect()
    return instance
  }

  // PRIVATE

  // Authentication
  #username
  #password
  #cluster
  #dbname

  #client
  #kmsProviders

  #needEncrypt

  /**
   * Constructor
   *
   * @param {String} username
   * @param {String} password
   * @param {String} cluster
   * @param {String} dbname
   * @param {{
   *   autoEncryption: Boolean,
   *   kmsProviders: {
   *     gcp: {
   *       email: String,
   *       privateKey: String,
   *     }
   *   }
   * }} opts
   * @returns {MongoDBFacade} Facade for mongodb
   */
  constructor(username, password, cluster, dbname, opts = {}) {
    const { autoEncryption = false, kmsProviders = null } = opts

    super()

    this.#username = username
    this.#password = password
    this.#cluster = cluster
    this.#dbname = dbname

    this.#needEncrypt = autoEncryption
    this.#kmsProviders = kmsProviders
  }

  /**
   * Establish a connection
   */
  async connect() {
    let con_settings = {
      ...DEFAULT_CONNECTION,
    }

    if (this.#needEncrypt) {
      const encryptionSettings = await getEncryptionSettings({
        username: this.#username,
        password: this.#password,
        cluster: this.#cluster,
        dbname: this.#dbname,
        kmsProviders: this.#kmsProviders,
      })

      con_settings = {
        ...con_settings,
        ...encryptionSettings,
      }
    }

    this.#client = new MongoClient(
      `mongodb+srv://${this.#username}:${this.#password}@${this.#cluster}/${
        this.#dbname
      }?retryWrites=true&w=majority`,
      con_settings,
    )

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
    if (!args || typeof args !== 'object')
      throw new TypeError('Arguments must be an object')

    const transformedArgs = {}

    for (const [key, value] of Object.entries(args)) {
      transformedArgs[key] = { $eq: value }
    }

    let table = await this.#getCollection(collection)
    return table.findOne(transformedArgs)
  }

  /**
   * Find first matching query
   * or create if not exist
   * @param {String} collection
   * @param {Object} query
   * @param {Object?} update
   * @returns {{*}}
   */
  async first_or_create(collection, query, update = {}) {
    let table = await this.#getCollection(collection)
    let result = await table.findOneAndUpdate(
      query,
      {
        $setOnInsert: { ...query, ...update },
      },
      {
        upsert: true,
        returnDocument: 'after',
        returnNewDocument: true,
      },
    )
    return this.#convert(result)
  }

  /**
   * Insert single record
   * in MongoDB
   * @param {String} collection
   * @param {Object} args
   * @returns {{
   *   acknowledged: Boolean,
   *   insertedId : Integer,
   * }}
   * @throws {WriteError | WriteConcernError}
   */
  async insert(collection, args) {
    let table = await this.#getCollection(collection)
    return table.insertOne(args)
  }

  // PRIVATE METHODS

  /**
   * Convert result to consumable
   * and standarised format.
   * @param {{*}} result
   * @returns {{
   *   *
   *   value: {
   *     _id: String,
   *   }
   * }}
   */
  async #convert(result) {
    if (!result) return result

    return {
      ...result,
      value: {
        _id: result.value._id.toString(),
      },
    }
  }

  /**
   * Get the collection from
   * client database
   * @param {String} collection
   * @returns {Collection}
   */
  async #getCollection(collection) {
    if (isBlank(collection)) throw new TypeError('Collection must a string')

    return this.#client.db().collection(collection)
  }
}
