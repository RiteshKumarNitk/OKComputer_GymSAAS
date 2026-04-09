import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled Error:', err);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default errorMiddleware;
