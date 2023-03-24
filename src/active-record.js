import Database from './database'

/**
 * Base class for any model
 */
export default class ActiveRecord {
  /**
   * List of properties that is
   * considered unique. This is
   * require to indicate to `save`
   * how to update or insert based
   * on those keys
   */
  static __primaryKey = ['id']

  /**
   * Flag if include fields
   * timestamp fields like
   * createdAt and updatedAt
   */
  static __timestamp = false

  /**
   * Create an instance and save
   * record
   * @param {{*}} args
   * @returns {T<ActiveRecord>} Model
   */
  static async create(args = {}) {
    const model = this.new(args)
    await model.save()
    return model
  }

  /**
   * Search record that match all
   * the arguments
   * @param {{*}} args
   * @returns {T<ActiveRecord>} Model
   */
  static async find(args) {
    const transaction = Database.createTransaction(this)
    return transaction.find(args)
  }

  /**
   * Alias for `new Model()`
   * @param {{*}} args
   * @returns {T<ActiveRecord>} Model
   */
  static new(args = {}) {
    return new this(args)
  }

  /**
   * Find first record matching
   * parameters. If not find,
   * create it.
   * @param {{*}} query
   * @param {{*}} update
   * @returns {T<ActiveRecord>} Model
   */
  static async first_or_create(query, update) {
    let model = this.new({
      ...query,
      ...update,
    })

    let createData = update

    if (this.__timestamp) {
      createData = {
        ...update,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      }
    }
    const transaction = Database.createTransaction(this)
    return transaction.first_or_create(query, createData)
  }

  // Protected properties
  _createdAt = new Date().getTime()
  _updatedAt = new Date().getTime()

  /**
   * Constructor
   * @param {{*}} properties
   */
  constructor(properties = {}) {
    if (new.target === ActiveRecord)
      throw new TypeError('Cannot construct ActiveRecord instances directly')

    if (!this._computedPrimaryKey)
      throw new TypeError('`__primaryKey` must be an array, a string or null.')

    Object.assign(this, properties)
  }

  /**
   * Setter for id
   * @param {String|Number}
   */
  set id(value) {
    this._id = value
  }

  /**
   * Getter for id
   * @returns {String|Number}
   */
  get id() {
    return this._id ? this._id : undefined
  }

  /**
   * Setter created at
   * @param {Timestamp} value
   */
  set createdAt(value) {
    this._createdAt = value
  }

  /**
   * Getter created at
   * @returns {Timestamp} creation date
   */
  get createdAt() {
    return this.constructor.__timestamp ? this._createdAt : undefined
  }

  /**
   * Setter updatedAt
   * @param {Timestamp} value
   */
  set updatedAt(value) {
    this._updatedAt = value
  }

  /**
   * Getter updated at
   * @returns {Timestamp} last update date
   */
  get updatedAt() {
    return this.constructor.__timestamp ? this._updatedAt : undefined
  }

  /**
   * Save model
   * - Insert if no primary keys defined
   * - Insert if any missing primary keys
   * - Update if all primary keys are set
   *
   * Validation should be done at getter/setter
   * level to ensure data integrity.
   *
   * @returns {Boolean} Indicate if save succeed or failed
   */
  async save() {
    try {
      let { primary_keys, data } = this.#toKeyVal

      // Check all the primary keys
      if (this.#allPrimaryKeyPresent && this.#hasPrimaryKeys) {
        // Update
        this.constructor.first_or_create(primary_keys, data)
        return true
      }

      let transaction = Database.createTransaction(this)
      await transaction.insert({
        ...primary_keys,
        ...data,
      })
      return true
    } catch {
      return false
    }
  }

  // PROTECTED GETTERS/SETTERS

  /**
   * Retrieve primary keys from
   * static model
   *
   * @returns {Array} Array or undefined if invalid primary key
   */
  get _computedPrimaryKey() {
    // Check if type accepted
    if (
      !Array.isArray(this.constructor.__primaryKey) &&
      this.constructor.__primaryKey !== null &&
      typeof this.constructor.__primaryKey !== 'string'
    )
      return undefined

    // Handle if null, return empty array
    if (!this.constructor.__primaryKey) return []
    return [this.constructor.__primaryKey].flat()
  }

  // PRIVATE GETTERS/SETTERS

  /**
   * Check that all primary key is
   * filled with a value.
   * @returns {Boolean}
   */
  get #allPrimaryKeyPresent() {
    return this._computedPrimaryKey.every((k) => Boolean(this[k]))
  }

  /**
   * Indicate if any primary key
   * has been defined for this model
   * @returns {Boolean}
   */
  get #hasPrimaryKeys() {
    return this._computedPrimaryKey.length > 0
  }

  /**
   * Convert model to plain object
   * @returns {
   *   primary_keys: {*}
   *   data: {*}
   * }
   */
  get #toKeyVal() {
    return Object.entries(this).reduce(
      (obj, [k, v]) => {
        let getter = k
        if (getter.startsWith('_')) getter = k.replace('_', '')
        if (!this[getter]) return obj

        if (this._computedPrimaryKey.includes(getter)) {
          obj.primary_keys[getter] = v
        } else {
          obj.data[getter] = v
        }

        return obj
      },
      { primary_keys: {}, data: {} },
    )
  }
}
