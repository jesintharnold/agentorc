import { z } from 'zod'

export const runJobschema = z.object({
  body: z.object({
    jobid: z
      .string({
        required_error: 'Valid Job ID is needed'
      })
      .uuid('Not a valid job id')
  })
})

export const taskschema = z.object({
  body: z.object({
    jobid: z
      .string({
        required_error: 'Valid Job ID is needed'
      })
      .uuid('Not a valid job id'),
    taskid: z
      .string({
        required_error: 'Valid Task ID is needed'
      })
      .uuid('Not a valid Task id')
  })
})

export const tasklogschema = z.object({
  body: z.object({
    jobid: z
      .string({
        required_error: 'Valid Job ID is needed'
      })
      .uuid('Not a valid job id'),
    taskid: z
      .string({
        required_error: 'Valid Task ID is needed'
      })
      .uuid('Not a valid Task id')
  }),
  logpart: z.number({
    required_error: 'Valid Task Log part number is needed'
  })
})

export const getjobschema = z.object({
  body: z.object({
    limit: z.number({
      required_error: 'valid limit is needed'
    }),
    page: z.number({
      required_error: 'valid page number is needed'
    })
  })
})
