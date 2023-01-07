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
   */
  get table() {
    return pluralize(this.#model.name.toLowerCase())
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
}
