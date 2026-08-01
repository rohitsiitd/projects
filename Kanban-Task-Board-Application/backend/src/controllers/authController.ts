import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../types/express.js';
import { AppError } from '../../types/appError.js';

const JWT_SECRET = process.env.JWT_SECRET as string;
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
};

// Register
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { username, email, password } = req.body;

  try {
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });

    if (existingUser) {
      return next(new AppError('Username or email already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        globalRole: 'USER', // default role
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        globalRole: newUser.globalRole,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Login
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError('Invalid username or password', 400)); // Invalidating the user if it doesn't exist in the database
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new AppError('Invalid username or password', 400));
    }

    const token = jwt.sign(
      {
        userId: user.id,
        globalRole: user.globalRole, //signing tokens
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        globalRole: user.globalRole,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('accessToken', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      globalRole: user.globalRole,
    });
  } catch (err) {
    next(err);
  }
};

export const refreshUser = async (
  // re-issuing of accesstoken
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(new AppError('Refresh Token missing', 401)); // no token generation without refresh token
    }

    const payload = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload;

    const dbtoken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!dbtoken) {
      return next(new AppError('Token revoked', 403));
    }

    const accessToken = jwt.sign(
      { userId: payload.userId, globalRole: payload.globalRole },
      JWT_SECRET!,
      { expiresIn: '1h' },
    );

    res.cookie('accessToken', accessToken, cookieOptions);

    res.json({ message: 'token refreshed' });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      await prisma.refreshToken.deleteMany({
        // deleting the refresh token
        where: { token },
      });
    }

    res.clearCookie('accessToken', cookieOptions); //clearing the cookies
    res.clearCookie('refreshToken', cookieOptions);

    res.json({ message: 'logged out' });
  } catch (err) {
    next(err);
  }
};

export const myProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.userId) return next(new AppError('Unauthorized', 401));

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return next(new AppError('No such user in database', 404));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;

    res.status(200).json(safeUser);
  } catch (err) {
    next(err);
  }
};
