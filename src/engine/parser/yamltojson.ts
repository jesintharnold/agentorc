/* eslint-disable @typescript-eslint/no-explicit-any */
import YAML from 'js-yaml'
import fs from 'fs-extra'
import path from 'path'
import Ajv from 'ajv'
import { JOB } from '../interfaces/enginecore'
import { ParseError } from './parse.error'
import { logger } from '../logger/logger'
const ajv = new Ajv({ strict: false })

const schemaPath = path.resolve(path.join(process.cwd(), '/src/engine/misc-files/schema.json'))
const schemaData = fs.readFileSync(schemaPath, 'utf-8')
const validateJson = ajv.compile(JSON.parse(schemaData))

export async function convertJson(yamlfile: string, yamlaspath: boolean = false): Promise<JOB> {
  try {
    if (yamlaspath && path.extname(yamlfile) != '.yaml') {
      throw new ParseError('Invalid file extension. Please provide a file with .yaml extension.', 'INVALID_EXTENSION')
    }
    if (yamlaspath) {
      const yamlfilepath = path.resolve(yamlfile)
      if (!(await fs.pathExists(yamlfilepath))) {
        throw new ParseError(`File not found or unreadable: ${yamlfilepath}`, 'FILE_READ_ERROR')
      }
      yamlfile = await fs.readFile(yamlfilepath, 'utf-8')
    }
    const yamlContent: JOB = (await YAML.load(yamlfile)) as JOB
    const valid = validateJson(yamlContent)
    if (!valid) {
      const errors = validateJson?.errors?.map((error) => error.message).join('\n')
      throw new ParseError(`Validation failed:\n${errors}`, 'VALIDATION_ERROR')
    }
    //Generate a UUID value
    return yamlContent
  } catch (error: any) {
    if (error instanceof ParseError) {
      throw error
    } else {
      logger.error('Unexpected error:', error)
      throw new ParseError('An unexpected error occurred while processing the workflow', 'UNEXPECTED_ERROR')
    }
  }
}

// ;(async function () {
//   const A = await convertJson(path.join(process.cwd(), '/src/engine/misc-files/demo-workflow.yaml'), true)
//   console.dir(A, { depth: null, colors: true })
// })()
