import Database from './database'

/**
 * Base class for any model
 */
export default class ActiveRecord {
  /**
   * Search record that match all
   * the arguments
   * @param {{*}} args
   * @returns {*} Model
   */
  static async find(args) {
    let transaction = Database.createTransaction(this)
    return transaction.find(args)
  }

  /**
   * Constructor
   * @param {{*}} properties
   */
  constructor(properties = {}) {
    for (let [k, v] of Object.entries(properties)) {
      this[k] = v
    }
  }
}
