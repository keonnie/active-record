import Transaction from './transaction'
import ActiveRecord from './active-record'

/**
 * Base class for Database
 */
class Database {
  #client

  /**
   * Constructor
   * @param {AbstractDBFacade} client
   */
  constructor(client) {
    this.#client = client
  }

  /**
   * Getter client
   */
  get client() {
    return this.#client
  }

  /**
   * Setter client
   * @param {AbstractDBFacade} client
   */
  set client(client) {
    this.#client = client
  }

  /**
   * Create a transaction to provide
   * a context accross the database layer
   * and the application layer
   * @param {ActiveRecord} model
   * @returns {Transaction}
   */
  createTransaction(model) {
    if (!model) throw new Error('Model must be provided.')
    if (!((model.prototype || model) instanceof ActiveRecord)) {
      throw new Error('Model must be an instance of ActiveRecord.')
    }

    return new Transaction(this.#client, model)
  }

  /**
   * Terminate database connection
   */
  async close() {
    await this.#client.close()
  }
}

/**
 * Define module as singleton
 */
export default new Database()
