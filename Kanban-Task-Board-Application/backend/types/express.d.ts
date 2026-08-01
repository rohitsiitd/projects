export interface JwtPayload {
  userId: number;
  globalRole: string;
}

export interface FileData {
  filename: string;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  path: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      file?: FileData;
    }
  }
}

export {};
