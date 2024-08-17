/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from 'vitest'
import { convertJson } from './yamltojson'
import path from 'path'

describe('YAML to Json Parser', () => {
  it('valid YAML as a path', async () => {
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
  it('valid YAML as content', async () => {
    const yaml_content = `
    name: ludacris
    description: John wick pretzel
    jobID: 0001
    image: ubuntu-latest
    tasks:
      - name: task-0
        description: task-0 wick emerges from shadow
        retrycount: 0
        depends_on: -----
        script: -----
        env:
          key1: value-1
          key2: value-2
    `
    const yaml_parse = await convertJson(yaml_content)
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
        }
      ]
    })
  })
  it('Invalid YAML workflow structure', async () => {
    const yaml_content = `
    name: ludacris
    description: John wick pretzel
    jobID: 0001
    tasks:
      - name: task-0
        description: task-0 wick emerges from shadow
        retrycount: 0
        depends_on: -----
        script: -----
    `
    await expect(convertJson(yaml_content)).rejects.toThrowError(
      "Validation failed:\nmust have required property 'image'"
    )
  })
  it('Invalid YAML as a path', async () => {
    await expect(
      convertJson(path.join(process.cwd(), '/src/engine/misc-files/demo-workflow.txt'), true)
    ).rejects.toThrowError('Invalid file extension. Please provide a file with .yaml extension.')
  })
})
