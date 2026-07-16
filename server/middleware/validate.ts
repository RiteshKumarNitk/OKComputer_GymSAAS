import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import logger from '../config/logger.js'

/**
 * Express middleware factory that validates request body against a Zod schema
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body)
      req.body = parsed // Replace with parsed (and transformed) data
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
        logger.warn('Validation failed:', errors)
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        })
      }
      next(error)
    }
  }
}
