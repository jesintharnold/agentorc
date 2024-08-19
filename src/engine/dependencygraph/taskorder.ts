/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { DepGraph } from 'dependency-graph'
import { JOB } from '../interfaces/enginecore'

export async function orderTask(data: JOB): Promise<string[]> {
  try {
    const graph = new DepGraph()
    const tasklength = data.tasks.length
    console.log(tasklength)
    data.tasks.map((_task, index) => {
      if (!graph.hasNode(index.toString())) {
        graph.addNode(index.toString())
      }
    })
    data.tasks.map((task, index) => {
      if (task.depends_on !== undefined || null) {
        //Add the node and their dependency
        const _tasks_ = task.depends_on?.split(',')
        _tasks_?.map((dtask) => {
          const digits = parseInt(dtask.substring(dtask.indexOf('[') + 1, dtask.indexOf(']')))
          if (dtask.startsWith('task') && digits < tasklength && digits !== index) {
            graph.addDependency(index.toString(), digits.toString())
          }
        })
      }
    })
    return graph.overallOrder()
  } catch (error: any) {
    console.error(error?.message)
    throw error
  }
}
