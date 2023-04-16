const CONFIG_YAML = `
collections:
  collection1:
    fields:
      field1:
        type: string
        algorithm: random
`

const { __mockReadFile } = await import('../../../__mocks__/node/fs/promises')
__mockReadFile.mockResolvedValue(CONFIG_YAML)

await import('../../../__mocks__/mongodb')
await import('../../../__mocks__/mongodb-client-encryption')
const { map } = await import('../../../src/mongo-db/encryption')

describe('Unit | MongoDB | Encryption', () => {
  describe('when mapping', () => {
    describe('with missing master key', () => {
      it('throw error', async () => {
        await expect(() =>
          map('username', 'password', 'cluster', 'dbname'),
        ).rejects.toThrow(Error('"collection1" is missing master key.'))
      })
    })
  })
})
