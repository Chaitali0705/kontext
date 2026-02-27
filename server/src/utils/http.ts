import type { Request, Response } from 'express';

const requestIdFrom = (req: Request): string =>
  String(req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

export const sendSuccess = (
  req: Request,
  res: Response,
  data: unknown,
  message: string = 'OK',
  status: number = 200
) => {
  return res.status(status).json({
    data,
    message,
    error: null,
    requestId: requestIdFrom(req)
  });
};

export const sendError = (req: Request, res: Response, status: number, message: string) => {
  return res.status(status).json({
    data: null,
    message,
    error: message,
    requestId: requestIdFrom(req)
  });
};
