/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express'
import { AnyZodObject } from 'zod'

export const schemavalidation = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    })
    return next()
  } catch (error: any) {
    return res.status(400).json(error)
  }
}
