# Task Board - Jira-Inspired Project Management Application

## Project Description

**Task Board** is a full-stack web application designed to streamline project management and team collaboration through a Jira-inspired interface. Built as a university assignment, this application demonstrates modern web development practices with a focus on role-based access control, real-time task management, and comprehensive activity tracking.

The application enables teams to organize work into hierarchical structures (Stories → Tasks/Bugs), manage Kanban boards with enforced WIP limits, track task assignments and status changes, and maintain detailed audit trails of all project activities. Users can collaborate through rich-text comments, receive notifications, and manage team members with granular permission controls.

---

## Tech Stack

### Frontend

- **React 19** - UI library for building interactive user interfaces
- **Vite** - Modern frontend build tool with HMR (Hot Module Replacement)
- **TypeScript** - Type-safe JavaScript for robust development
- **CSS Modules** - Scoped styling to prevent style conflicts
- **React Router DOM** - Client-side routing for multi-page navigation
- **Native HTML Drag-and-Drop API** - No external dependencies for drag-and-drop functionality

### Backend

- **Node.js** - JavaScript runtime for server-side execution
- **Express.js** - Web framework for building REST APIs
- **TypeScript** - Type safety for backend development
- **JWT (JSON Web Tokens)** - Stateless authentication mechanism
- **bcrypt** - Password hashing and verification

### Database & ORM

- **PostgreSQL** - Relational database for persistent data storage
- **Prisma** - Modern ORM with type-safe database access

### Authentication & Security

- **HTTP-only Cookies** - Secure token storage to prevent XSS attacks
- **JWT with Refresh Tokens** - Secure authentication with token rotation
- **bcrypt** - Password hashing with salt rounds for maximum security
- **CORS** - Cross-Origin Resource Sharing for secure API access

### Development & DevOps

- **ESLint** - Code quality and style enforcement
- **Prettier** - Code formatting for consistency
- **Nodemon** - Auto-restart server during development
- **ts-node** - Direct TypeScript execution without compilation

---

## Setup, Compile, and Run Instructions

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager (comes with Node.js)
- **PostgreSQL** (version 12 or higher) - [Download](https://www.postgresql.org/)
- **Git** - Version control system

Verify installations:

```bash
node --version   # Should show v18.0.0 or higher
npm --version    # Should show 9.0.0 or higher
psql --version   # Should show PostgreSQL version 12+
```

### Step 1: Clone the Repository

```bash
# Clone the repository to your local machine
git clone https://github.com/yourusername/task-board.git

# Navigate to the project directory
cd task-board
```

### Step 2: Setup Environment Variables

#### Backend Environment Variables

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a `.env` file in the `backend/` directory by copying the example or creating a new file:

```bash
touch .env
```

3. Open `.env` and configure the following variables with your actual settings:

```env
# Database Configuration
# Replace with your PostgreSQL connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/task_board_db


# Server Configuration
PORT=5050
NODE_ENV=development

# JWT Configuration
# Use a strong random string for production
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRY=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret_change_this
REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
# Must match your frontend URL
FRONTEND_URL=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads/avatars
```

#### Frontend Environment Variables

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API Configuration
VITE_API_URL=http://localhost:5050/api
VITE_API_BASE_URL=http://localhost:5050
```

### Step 3: Setup PostgreSQL Database

1. Create a new PostgreSQL database:

```bash
# Connect to PostgreSQL with default postgres user
sudo -u postgres psql;

# In the psql console, create the database:
CREATE DATABASE task_board_db;

# Change the password to match the url (if password not set)
ALTER USER postgres PASSWORD 'password';

# List databases to verify
\l

# Exit psql
\q
```

2. Update your DATABASE_URL in `backend/.env` with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/task_board_db
```

### Step 4: Install Dependencies

#### Backend Dependencies

```bash
# From project root, navigate to backend
cd backend

# Install dependencies
npm install

# Verify installation
npm list
```

#### Frontend Dependencies

```bash
# From backend directory, go to frontend
cd ../frontend

# Install dependencies
npm install

# Verify installation
npm list
```

### Root Dependencies

```bash
# From Root Directory (To get cookie parser)

npm install

```

### Step 5: Setup Prisma and Database

```bash
# Navigate to backend directory (if not already there)
cd backend

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the db for adding a global admin.
# Email: admin@taskboard.com
# Username: admin
# Password: a
npx prisma db seed
```

The database schema will now be synchronized with your PostgreSQL instance.

### Step 6: Compile TypeScript (Optional for Development)

```bash
# From backend directory
npm run build

# From frontend directory (if needed)
cd ../frontend
npm run build
```

### Step 7: Start Development Servers

#### Option A: Running Backend and Frontend Separately

**Terminal 1 - Backend Server:**

```bash
# From the project root
cd backend

# Start the development server (with auto-reload)
npm run dev
```

The backend server will start using nodemon with TypeScript support and watch for file changes.

**Terminal 2 - Frontend Development Server:**

```bash
# From the project root
cd frontend

# Start Vite development server
npm run dev
```

Vite will start a development server with Hot Module Replacement (HMR) enabled, typically available at `http://localhost:5173/`

#### Option B: Running From Project Root (if configured)

```bash
# From project root
npm run dev:backend &  # Runs in background
npm run dev:frontend   # Runs in foreground
```

### Step 8: Verify Setup

Open your browser and navigate to:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5050/api
- **Swagger/API Docs (if configured):** http://localhost:5050/api-docs

### Production Build and Deployment

#### Build Backend for Production

```bash
cd backend
npm run build

# Start production server
npm start
```

#### Build Frontend for Production

```bash
cd frontend
npm run build

# Preview production build (optional)
npm run preview
```

#### Environment Variables for Production

Update production environment variables:

**Backend (.env for production)**

```env
NODE_ENV=production
PORT=5050
DATABASE_URL=postgresql://prod_user:prod_password@prod_host:5432/prod_db
JWT_SECRET=<generate-with-openssl-rand-base64-32>
REFRESH_TOKEN_SECRET=<generate-with-openssl-rand-base64-32>
FRONTEND_URL=https://yourdomain.com
```

To generate secure random secrets:

```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For REFRESH_TOKEN_SECRET
```

---

## API Documentation

### Base URL

```
http://localhost:5050/api
```

### Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT authentication via HTTP-only cookies.

---

### Authentication Endpoints

| Method | Endpoint          | Description                       | Request Body                                                        |
| ------ | ----------------- | --------------------------------- | ------------------------------------------------------------------- |
| `POST` | `/auth/register`  | Register a new user               | `{ "username": "string", "email": "string", "password": "string" }` |
| `POST` | `/auth/login`     | Authenticate user and receive JWT | `{ "email": "string", "password": "string" }`                       |
| `POST` | `/auth/logout`    | Revoke authentication token       | none                                                                |
| `POST` | `/auth/refresh`   | Refresh expired JWT token         | none                                                                |
| `GET`  | `/auth/myprofile` | Get current user's profile        | none                                                                |

**Example Requests:**

Register:

```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Login:

```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

---

### Projects Endpoints

| Method   | Endpoint                         | Description                          | Required Role                                               |
| -------- | -------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `POST`   | `/projects`                      | Create a new project                 | GLOBAL_ADMIN                                                |
| `GET`    | `/projects`                      | List all projects user has access to | Any authenticated user                                      |
| `GET`    | `/projects/:projectId`           | Get project details                  | GLOBAL_ADMIN, PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_VIEWER |
| `PATCH`  | `/projects/:projectId`           | Update project details               | GLOBAL_ADMIN, PROJECT_ADMIN                                 |
| `DELETE` | `/projects/:projectId`           | Delete project                       | GLOBAL_ADMIN                                                |
| `POST`   | `/projects/:projectId/archive`   | Archive project                      | GLOBAL_ADMIN                                                |
| `POST`   | `/projects/:projectId/unarchive` | Unarchive project                    | GLOBAL_ADMIN                                                |

**Example Request Bodies:**

Create Project:

```json
{
  "name": "E-Commerce Platform",
  "description": "Build a scalable online store"
}
```

Update Project:

```json
{
  "name": "E-Commerce Platform v2.0",
  "description": "Build a scalable online store with advanced features"
}
```

---

### Boards & Columns Endpoints

#### Boards

| Method   | Endpoint                               | Description                               | Required Role                                 |
| -------- | -------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `POST`   | `/projects/:projectId/boards`          | Create a new board                        | PROJECT_ADMIN                                 |
| `GET`    | `/projects/:projectId/boards`          | List all boards in project                | PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_VIEWER |
| `GET`    | `/projects/:projectId/boards/:boardId` | Get board details with columns            | PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_VIEWER |
| `PUT`    | `/projects/:projectId/boards/:boardId` | Update board (rename, update description) | PROJECT_ADMIN                                 |
| `DELETE` | `/projects/:projectId/boards/:boardId` | Delete board and all columns/tasks        | PROJECT_ADMIN                                 |

#### Columns

| Method   | Endpoint                                                 | Description                            | Required Role                                 |
| -------- | -------------------------------------------------------- | -------------------------------------- | --------------------------------------------- |
| `POST`   | `/projects/:projectId/boards/:boardId/columns`           | Create a new column                    | PROJECT_ADMIN                                 |
| `GET`    | `/projects/:projectId/boards/:boardId/columns`           | List all columns in board              | PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_VIEWER |
| `PUT`    | `/projects/:projectId/boards/:boardId/columns/:columnId` | Update column (name, WIP limit, order) | PROJECT_ADMIN                                 |
| `DELETE` | `/projects/:projectId/boards/:boardId/columns/:columnId` | Delete column and all tasks            | PROJECT_ADMIN                                 |

**Example Request Bodies:**

Create Board:

```json
{
  "title": "Development Board",
  "description": "Kanban board for sprint tasks"
}
```

Create Column:

```json
{
  "title": "To Do",
  "order": 1,
  "status": "TODO",
  "wipLimit": 10
}
```

Update Column:

```json
{
  "title": "In Progress",
  "order": 2,
  "wipLimit": 5
}
```

---

### Tasks Endpoints

| Method   | Endpoint                                                                    | Description                                      | Required Role                                 |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| `POST`   | `/projects/:projectId/boards/:boardId/columns/:columnId/tasks`              | Create a new task                                | PROJECT_ADMIN, PROJECT_MEMBER                 |
| `GET`    | `/projects/:projectId/boards/:boardId/columns/:columnId/tasks`              | List all tasks in column                         | PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_VIEWER |
| `GET`    | `/projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId`      | Get detailed task information                    | PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_VIEWER |
| `PUT`    | `/projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId`      | Update task (title, description, priority, etc.) | PROJECT_ADMIN, PROJECT_MEMBER                 |
| `PATCH`  | `/projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId/move` | Move task to different column (drag & drop)      | PROJECT_ADMIN, PROJECT_MEMBER                 |
| `DELETE` | `/projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId`      | Delete task                                      | PROJECT_ADMIN, PROJECT_MEMBER                 |

**Example Request Bodies:**

Create Task:

```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication with HTTP-only cookies",
  "issueType": "STORY",
  "priority": "HIGH",
  "assigneeId": 5,
  "parentTaskId": null
}
```

Update Task:

```json
{
  "title": "Implement user authentication - Updated",
  "description": "Add JWT-based authentication with secure refresh tokens",
  "priority": "CRITICAL",
  "assigneeId": 5
}
```

Move Task:

```json
{
  "targetColumnId": 3
}
```

---

### Team Members (Project Members) Endpoints

| Method   | Endpoint                              | Description                  | Required Role                                 |
| -------- | ------------------------------------- | ---------------------------- | --------------------------------------------- |
| `GET`    | `/projects/:projectId/members`        | List all project members     | PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_VIEWER |
| `POST`   | `/projects/:projectId/members/:email` | Add member to project        | PROJECT_ADMIN                                 |
| `DELETE` | `/projects/:projectId/members/:email` | Remove member from project   | PROJECT_ADMIN                                 |
| `PATCH`  | `/projects/:projectId/members/:email` | Update member's project role | PROJECT_ADMIN                                 |

**Example Request Bodies:**

Add Member:

```json
{
  "role": "PROJECT_MEMBER"
}
```

Update Member Role:

```json
{
  "role": "PROJECT_ADMIN"
}
```

**Available Roles:**

- `PROJECT_ADMIN` - Full project permissions
- `PROJECT_MEMBER` - Can create and manage tasks
- `PROJECT_VIEWER` - Read-only access

---

### Comments Endpoints

| Method   | Endpoint                                                 | Description                 | Required Role                                 |
| -------- | -------------------------------------------------------- | --------------------------- | --------------------------------------------- |
| `GET`    | `/projects/:projectId/tasks/:taskId/comments`            | List all comments on a task | PROJECT_ADMIN, PROJECT_MEMBER, PROJECT_VIEWER |
| `POST`   | `/projects/:projectId/tasks/:taskId/comments`            | Add comment to task         | PROJECT_ADMIN, PROJECT_MEMBER                 |
| `PUT`    | `/projects/:projectId/tasks/:taskId/comments/:commentId` | Edit existing comment       | Commenter or PROJECT_ADMIN                    |
| `DELETE` | `/projects/:projectId/tasks/:taskId/comments/:commentId` | Delete comment              | Commenter or PROJECT_ADMIN                    |

**Example Request Bodies:**

Create Comment:

```json
{
  "content": "This task is critical and needs immediate attention"
}
```

Update Comment:

```json
{
  "content": "Updated comment: This task needs careful implementation with proper testing"
}
```

---

### Users Endpoints

| Method  | Endpoint          | Description                            | Required Role          |
| ------- | ----------------- | -------------------------------------- | ---------------------- |
| `GET`   | `/users`          | List all users (paginated, searchable) | Any authenticated user |
| `PATCH` | `/users/:id/role` | Update user's global role              | GLOBAL_ADMIN           |
| `PATCH` | `/users/avatars`  | Upload and update user avatar          | Any authenticated user |

**Query Parameters for GET /users:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 50)
- `search` - Search by username or email

**Example Request Bodies:**

Update User Role:

```json
{
  "globalRole": "GLOBAL_ADMIN"
}
```

Upload Avatar (multipart/form-data):

```bash
curl -X PATCH http://localhost:5050/api/users/avatars \
  -H "Cookie: token=your_jwt_token" \
  -F "avatar=@/path/to/avatar.jpg"
```

---

### Error Response Format

All error responses follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation Error: User already exists",
  "error": "BadRequest"
}
```

**Common Status Codes:**

- `200` - OK (success)
- `201` - Created (resource created successfully)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server error)

---

## Role-Based Access Control (RBAC)

### Global Roles

- **GLOBAL_ADMIN** - System administrator with access to all projects and user management
- **USER** - Regular user, can create projects and join as member

### Project Roles

- **PROJECT_ADMIN** - Full control over project, boards, tasks, and members
- **PROJECT_MEMBER** - Can create and manage tasks, view boards
- **PROJECT_VIEWER** - Read-only access to project boards and tasks

---

## Key Features

### 1. Hierarchical Task Management

- **Stories** - High-level features or epics
- **Tasks** - Individual work items (child of stories)
- **Bugs** - Issues and defects (child of stories)

### 2. Kanban Board Management

- Drag-and-drop task movement between columns
- Enforced WIP (Work In Progress) limits per column
- Automated workflow transitions

### 3. Activity Tracking

- Comprehensive audit log of all changes
- Track status changes, assignments, and comments
- Activity timeline for each task

### 4. Rich Collaboration

- Comments with mention support
- Real-time notifications
- User profiles with avatars

### 5. Security Features

- JWT-based authentication with refresh tokens
- HTTP-only cookies for token storage
- bcrypt password hashing
- Role-based access control (RBAC)
- CORS protection

---

## Database Schema Highlights

### Key Tables

- **Users** - User accounts with global roles and authentication
- **Projects** - Project definitions with creators and members
- **Boards** - Kanban boards within projects
- **Columns** - Board columns with WIP limits
- **Tasks** - Work items with priority, status, and hierarchy
- **ProjectMembership** - User-project assignments with roles
- **Comments** - Task comments with timestamps
- **AuditLog** - Activity history for compliance
- **Notifications** - User notifications for important events
- **WorkflowTransitions** - Allowed status transitions per project

---

## Development Guidelines

### Code Standards

- **TypeScript** - Strict mode enabled for type safety
- **ESLint** - Enforced linting rules for code quality
- **Prettier** - Automated code formatting

### Project Structure

```
task-board/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # Helper functions
│   │   ├── app.ts            # Express app setup
│   │   └── server.ts         # Server entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API clients
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript definitions
│   │   ├── api/              # API integration
│   │   └── main.tsx          # App entry point
│   └── package.json
└── README.md
```

### Running Tests

The project includes comprehensive test suites for the backend. Tests are written using Node.js built-in test framework.

#### Backend Tests

**Prerequisites for testing:**

- Ensure the development environment is set up (dependencies installed)
- Create a separate test database (optional but recommended)

**Run all backend tests:**

```bash
cd backend
npx tsx --test "tests/**/*.test.ts"
```

**Run specific test file:**

```bash
cd backend
npx tsx --test tests/columnService.test.ts
```

**Available test files (in `backend/tests/`):**

- `authController.test.ts` - Authentication controller tests
- `authenticateJWT.test.ts` - JWT middleware tests
- `avatarUpload.test.ts` - Avatar upload middleware tests
- `boardController.test.ts` - Board management tests
- `boardService.test.ts` - Board service logic tests
- `columnController.test.ts` - Column controller tests
- `columnService.test.ts` - Column service tests
- `commentController.test.ts` - Comment controller tests
- `errorMiddleware.test.ts` - Error handling middleware tests
- `helper.test.ts` - Helper utility tests
- `manageMembers.test.ts` - Member management tests
- `notificationController.test.ts` - Notification controller tests
- `projectController.test.ts` - Project controller tests
- `requireGlobalAdmin.test.ts` - Global admin authorization tests
- `requireProjectRole.test.ts` - Project role authorization tests
- `taskController.test.ts` - Task controller tests
- `taskHelper.test.ts` - Task helper utility tests
- `tasksService.test.ts` - Task service tests
- `tastActivityService.test.ts` - Task activity service tests
- `userController.test.ts` - User controller tests
- `workflowController.test.ts` - Workflow controller tests

#### E2E Integration Tests

The project includes robust End-to-End integration tests using `supertest` and the native `node:test` runner. These tests automatically wipe and seed a real database before verifying exact API behaviors (Happy and Sad paths) and checking the actual PostgreSQL database contents directly through Prisma.

**Run E2E tests:**

```bash
cd backend
npx tsx --test tests/integration/apiE2E.test.ts
```

**Available integration test files (in `backend/tests/integration/`):**

- `apiE2E.test.ts` - Express endpoints E2E tests for Boards, Columns, and Tasks with database assertions.
- `testSetup.ts` - Database teardown and JWT test cookie helper.

### Linting and Formatting

```bash
# Lint files
npm run lint

# Format code with Prettier
npm run format

# Check format without changes
npm run check-format
```

---

## Common Issues and Troubleshooting

### Issue: Database Connection Failed

**Solution:** Verify PostgreSQL is running and credentials in `.env` are correct

```bash
# Check PostgreSQL status (Linux)
sudo systemctl status postgresql

# Test connection
psql -U postgres -d task_board_db
```

### Issue: Port Already in Use

**Solution:** Change port in `.env` or kill the process

```bash
# Find process using port 5050
lsof -i :5050

# Kill process
kill -9 <PID>
```

### Issue: JWT Token Expired

**Solution:** The frontend will automatically refresh the token using the refresh token endpoint

### Issue: CORS Error

**Solution:** Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL

### Issue: Prisma Migration Failed

**Solution:** Reset database and re-run migrations

```bash
cd backend
npx prisma migrate reset
```

---
