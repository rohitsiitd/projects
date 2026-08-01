import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../types/appError.js';

const JWT_SECRET = process.env.JWT_SECRET as string;
interface JwtPayload {
  userId: number;
  globalRole: string;
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined;
  const cookieToken = req.cookies?.accessToken as string | undefined;
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new AppError('Token missing', 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};
