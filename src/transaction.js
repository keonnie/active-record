import { pluralize } from 'inflected'

/**
 * Bridge to ensure to be in the
 * current database context
 */
export default class Transaction {
  #context
  #model

  /**
   * Constructor
   * @param {AbstractDBFacade} context
   * @param {Class} model
   */
  constructor(context, model) {
    this.#context = context
    this.#model = model
  }

  /**
   * Getter to have the table name
   * The table name is based on the class
   * name of the model provided in lowercase
   * and plurialized
   * @returns {String} table name
   */
  get table() {
    // Get the name of the class from instance
    let model_name = this.#model.constructor.name
    // Check if it's a class provided
    if (
      typeof this.#model === 'function' &&
      /^\s*class\s+/.test(this.#model.toString())
    ) {
      model_name = this.#model.name
    }
    return pluralize(model_name.toLowerCase())
  }

  /**
   * Find records perfectly matching
   * arguments passed and return the
   * first match
   * @param {{*}} args
   * @returns {*} Instance of the model
   */
  async find(args) {
    let result = await this.#context.find(this.table, args)
    return result ? new this.#model(result) : result
  }

  /**
   * Find first match or create
   * it if not existing
   * @param {{*}} query
   * @param {{*}} update
   * @returns {*} Instance of the model
   */
  async first_or_create(query, update) {
    let result = await this.#context.first_or_create(this.table, query, update)
    return new this.#model(result?.value || {})
  }

  /**
   * Insert record
   * @param {{*}} args
   * @returns {*} Instance of the model
   */
  async insert(args) {
    let result = await this.#context.insert(this.table, args)
    this.#model.id = result.insertedId
    return this.#model
  }
}
