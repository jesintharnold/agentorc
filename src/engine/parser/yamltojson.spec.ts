/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it } from 'mocha'
import { convertJson } from './yamltojson'
import path from 'path'

describe('YAML to Json Parser', () => {
  it('valid YAML to Json', async () => {
    const yaml_parse = await convertJson(path.join(process.cwd(), '/demo-files/demo-workflow.yaml'), true)
  })
  it('Invalid YAML workflow structure', () => {})
  it('Invalid YAML file extension', () => {})
})
