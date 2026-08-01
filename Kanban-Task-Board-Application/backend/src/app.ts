import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import boardRoutes from './routes/boardRoutes.js';
import columnRoutes from './routes/columnRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import workflowTransitionRoutes from './routes/workflowTransitionsRoutes.js';
import projectRoutes from './routes/projectAPI.js';
import { User } from '@prisma/client';

const app: Application = express();

//cors for specific origin:
const corsOptions = {
  origin: ['http://localhost:5173'],
  credentials: true,
};

// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//static files
app.use('/uploads', express.static('uploads'));

//routes:
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', projectRoutes);
app.use('/api/projects/:projectId/boards', boardRoutes);
app.use('/api/projects/:projectId/boards/:boardId/columns', columnRoutes);
app.use(
  '/api/projects/:projectId/boards/:boardId/columns/:columnId/tasks',
  taskRoutes,
);
app.use('/api/projects/:projectId/tasks/:taskId/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use(
  '/api/projects/:projectId/boards/:boardId/workflows',
  workflowTransitionRoutes,
);

// test route
app.get('/', (req, res) => {
  res.send('Welcome to our server ROHIT.');
});

const users: User[] = [];
app.post('/users', (req: Request, res: Response) => {
  const user = req.body;
  users.push(user);
  res.status(201).send(user);
});

app.use(errorMiddleware);
export default app;
