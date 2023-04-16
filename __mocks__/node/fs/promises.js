import { jest } from '@jest/globals'

export const __mockReadFile = jest.fn()

jest.unstable_mockModule('node:fs/promises', () => ({
  readFile: __mockReadFile,
}))

export const { readFile } = await import('node:fs/promises')
