/**
 * Base class for any DB Driver facade
 * and provide a common interface for
 * all DB Driver
 */
export default class AbstractDBFacade {
  /**
   * Constructor
   * Validate that cannot be directly
   * instanciated
   */
  constructor() {
    if (this.constructor === AbstractDBFacade) {
      throw new Error('`AbstractDBFacade` cannot be instanciated directly.')
    }
  }

  /**
   * Close Database connection
   * @abstract
   */
  async close() {}
}
