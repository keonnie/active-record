import Path from 'node:path'

const { __mockReadFile } = await import('../../__mocks__/node/fs/promises')
const { getYAMLFile } = await import('./get-root-app-file')

describe('Unit | Helpers | getRootAppFile', () => {
  afterEach(() => {
    __mockReadFile.mockClear()
  })

  it('should return empty object when readFile throws an error', async () => {
    __mockReadFile.mockRejectedValue(new Error('file not found'))

    const result = await getYAMLFile('.karenc.yml')

    expect(result).toEqual({})
    expect(__mockReadFile).toHaveBeenCalledTimes(1)
    expect(__mockReadFile).toHaveBeenCalledWith(
      Path.resolve(process.cwd(), '.karenc.yml'),
    )
  })

  it('should return parsed json when readFile is successful', async () => {
    const fileContent = `
    masterKeys:
      keyAltName:
        projectId: myproject
        location: mylocation
        keyRing: mykeyring
        keyName: mykeyname
      anotherkeyAltName:
        location: anotherlocation
        projectId: anotherproject
        keyRing: anotherkeyring
        keyName: anotherkeyname
    `

    __mockReadFile.mockResolvedValue(Buffer.from(fileContent))

    const result = await getYAMLFile('.karenc.yml')

    expect(result).toMatchObject({
      masterKeys: {
        keyAltName: {
          projectId: 'myproject',
          location: 'mylocation',
          keyRing: 'mykeyring',
          keyName: 'mykeyname',
        },
        anotherkeyAltName: {
          projectId: 'anotherproject',
          location: 'anotherlocation',
          keyRing: 'anotherkeyring',
          keyName: 'anotherkeyname',
        },
      },
    })
    expect(__mockReadFile).toHaveBeenCalledTimes(1)
    expect(__mockReadFile).toHaveBeenCalledWith(
      Path.resolve(process.cwd(), '.karenc.yml'),
    )
  })
})
