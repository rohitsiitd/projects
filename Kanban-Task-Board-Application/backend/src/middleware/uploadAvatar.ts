import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';

const avatarUploadDir = path.resolve(process.cwd(), 'uploads/avatars');
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface FileData {
  filename: string;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  path: string;
}

// Custom middleware to parse multipart form-data for avatar uploads
export const uploadAvatar = {
  single: (fieldName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        fs.mkdirSync(avatarUploadDir, { recursive: true });
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('multipart/form-data')) {
          return next();
        }

        // Extract the boundary string from the Content Type header
        const boundaryMatch = contentType.match(/boundary=([^;]+)/);
        if (!boundaryMatch) {
          res.status(400).json({ error: 'Invalid Content-Type header' });
          return;
        }
        const boundary = boundaryMatch[1].trim();

        // Collect the raw request stream into a buffer array
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks);
            const bodyStr = body.toString('binary');
            const parts = bodyStr.split('--' + boundary);
            let fileData: FileData | undefined;

            // Parse the multipart body to isolate the target file and its metadata
            for (const part of parts) {
              if (part.includes(`name="${fieldName}"`)) {
                const [headerSection, ...contentSection] =
                  part.split('\r\n\r\n');
                if (contentSection.length === 0) continue;
                const headers = headerSection
                  .split('\r\n')
                  .filter((line) => line.trim());
                let filename = '';
                let mimetype = 'application/octet-stream';
                for (const header of headers) {
                  if (header.includes('filename=')) {
                    const match = header.match(/filename="([^"]+)"/);
                    if (match) filename = match[1];
                  }
                  if (header.includes('Content-Type:')) {
                    const match = header.match(/Content-Type: (.+)/);
                    if (match) mimetype = match[1].trim();
                  }
                }
                if (!filename) continue;
                let content = contentSection.join('\r\n\r\n');
                content = content.replace(/\r\n--.*$/s, '');
                const fileBuffer = Buffer.from(content, 'binary');

                if (fileBuffer.length > MAX_FILE_SIZE) {
                  res
                    .status(400)
                    .json({ error: 'File size exceeds 5MB limit' });
                  return;
                }

                const storedFilename = `${Date.now()}-${filename}`;
                const filePath = path.join(avatarUploadDir, storedFilename);

                // Save the validated file to the filesystem
                fs.writeFileSync(filePath, fileBuffer);

                fileData = {
                  filename: storedFilename,
                  fieldname: fieldName,
                  originalname: filename,
                  encoding: '7bit',
                  mimetype: mimetype,
                  size: fileBuffer.length,
                  destination: avatarUploadDir,
                  path: filePath,
                };
                break;
              }
            }
            req.file = fileData;
            next();
          } catch (error) {
            next(error);
          }
        });

        req.on('error', (error) => {
          next(error);
        });
      } catch (error) {
        next(error);
      }
    };
  },
};
