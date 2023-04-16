import { readFile } from 'node:fs/promises'
import Path from 'node:path'
import YAML from 'yaml'

/**
 * Reads and returns the contents of
 * a YAML configuration file located
 * in the root directory of the application.
 *
 * @param {string} fileName - The name of the file to be read.
 * @returns {Object} - An object containing the contents
 * of the specified file.
 * Returns an empty object if the file cannot be read.
 */
export async function getYAMLFile(fileName) {
  try {
    const root_app_path = Path.resolve(process.cwd(), fileName)
    const yaml = await readFile(root_app_path)
    return YAML.parse(yaml.toString())
  } catch (ex) {
    return {}
  }
}
