import { jest } from '@jest/globals'
import { default as source } from 'mongodb'

// Client level mocks
export const __mockConnect = jest.fn()
export const __mockClose = jest.fn()
export const __mockDB = jest.fn()
// DB level mocks
export const __mockCollection = jest.fn()
// Collection level mocks
export const __mockFindOne = jest.fn()
export const __mockFindOneAndUpdate = jest.fn()
export const __mockInsertOne = jest.fn()

__mockCollection.mockResolvedValue({
  findOne: __mockFindOne,
  findOneAndUpdate: __mockFindOneAndUpdate,
  insertOne: __mockInsertOne,
})

__mockDB.mockReturnValue({
  collection: __mockCollection,
})

jest.unstable_mockModule('mongodb', () => ({
  ...source,
  MongoClient: jest.fn().mockImplementation(() => {
    return {
      connect: __mockConnect,
      close: __mockClose,
      db: __mockDB,
    }
  }),
}))

export const { ObjectId, MongoClient } = await import('mongodb')
