import { Request, Response, NextFunction } from "express";

export function auditMiddleware(_entity?: string, _action?: string) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}

