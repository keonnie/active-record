const { __mockReadFile } = await import('../../../__mocks__/node/fs/promises')
__mockReadFile.mockRejectedValue(new Error('Configuration file not found'))

await import('../../../__mocks__/mongodb')
await import('../../../__mocks__/mongodb-client-encryption')
const { map } = await import('../../../src/mongo-db/encryption')

describe('Unit | MongoDB | Encryption', () => {
  describe('when mapping', () => {
    describe('without configuration file', () => {
      it('throw error', async () => {
        await expect(() =>
          map('username', 'password', 'cluster', 'dbname'),
        ).rejects.toThrow(Error('No configuration file detected.'))
      })
    })
  })
})
