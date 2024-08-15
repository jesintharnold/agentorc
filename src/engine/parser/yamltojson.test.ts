/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from 'vitest'
import { convertJson } from './yamltojson'
import path from 'path'

describe('YAML to Json Parser', () => {
  it('valid YAML to Json', async () => {
    const yaml_parse = await convertJson(path.join(process.cwd(), '/src/engine/misc-files/demo-workflow.yaml'), true)
    expect(yaml_parse).to.deep.equal({
      name: 'ludacris',
      description: 'John wick pretzel',
      jobID: 1,
      image: 'ubuntu-latest',
      tasks: [
        {
          name: 'task-0',
          description: 'task-0 wick emerges from shadow',
          retrycount: 0,
          depends_on: '-----',
          script: '-----',
          env: { key1: 'value-1', key2: 'value-2' }
        },
        {
          name: 'task-1',
          description: 'task-0 wick emerges from shadow',
          retrycount: 0,
          depends_on: 'task-0',
          script: '-----',
          env: { key3: 'value-3', key4: 'value-4' }
        }
      ]
    })
  })
  it('Invalid YAML workflow structure', () => {})
  it('Invalid YAML file extension', () => {})
})
