import { jest } from '@jest/globals'

// Client level mocks
export const __mockConnect = jest.fn()
export const __mockClose = jest.fn()
export const __mockDB = jest.fn()
// DB level mocks
export const __mockCollection = jest.fn()
// Collection level mocks
export const __mockFindOne = jest.fn()

__mockCollection.mockResolvedValue({
  findOne: __mockFindOne,
})

__mockDB.mockReturnValue({
  collection: __mockCollection,
})

jest.unstable_mockModule('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => {
    return {
      connect: __mockConnect,
      close: __mockClose,
      db: __mockDB,
    }
  }),
}))

export const { MongoClient } = await import('mongodb')
