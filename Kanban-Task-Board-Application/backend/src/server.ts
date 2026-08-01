import dotenv from 'dotenv';
dotenv.config();

import type { AddressInfo } from 'node:net';
import app from './app.js';

const PORT = Number(process.env.PORT) || 5050;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const address = server.address() as AddressInfo | null;
  const port = address?.port ?? PORT;
  console.log(`Server running on http://${HOST}:${port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the existing process or change PORT in backend/.env.`,
    );
    process.exit(1);
  }

  console.error('Server failed to start:', error.message);
  process.exit(1);
});
