import { jest } from '@jest/globals'

const moduleName = 'mongodb-client-encryption'

// Encryption
export const __mockGetKeysToArray = jest.fn()
export const __mockCreateDataKey = jest.fn()
export const __mockGetKeyByAltName = jest.fn()

jest.unstable_mockModule(moduleName, () => ({
  ClientEncryption: jest.fn().mockImplementation(() => {
    return {
      getKeys: jest.fn().mockImplementation(() => ({
        toArray: __mockGetKeysToArray,
      })),
      createDataKey: __mockCreateDataKey,
      getKeyByAltName: __mockGetKeyByAltName,
    }
  }),
}))

export const { ClientEncryption } = await import(moduleName)
