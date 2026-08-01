//Enums:
// 1. Global Roles
export const GlobalRole = {
  GlobalAdmin: 'GLOBAL_ADMIN',
  User: 'USER',
} as const;
export type GlobalRole = (typeof GlobalRole)[keyof typeof GlobalRole];

export const ColumnStatus = {
  ToDo: 'ToDo',
  InReview: 'InReview',
  InProgress: 'InProgress',
  Done: 'Done',
} as const;

export type ColumnStatus = (typeof ColumnStatus)[keyof typeof ColumnStatus];
// 2. Project Roles
export const ProjectRole = {
  ProjectAdmin: 'PROJECT_ADMIN',
  ProjectMember: 'PROJECT_MEMBER',
  ProjectViewer: 'PROJECT_VIEWER',
} as const;
export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

// 3. Priority Levels
export const Priority = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

// 4. Activity Types
export const ActivityType = {
  StatusChange: 'STATUS_CHANGE',
  AssigneeChange: 'ASSIGNEE_CHANGE',
  PriorityChange: 'PRIORITY_CHANGE',
  CommentAdded: 'COMMENT_ADDED',
  CommentEdited: 'COMMENT_EDITED',
  CommentDeleted: 'COMMENT_DELETED',
  TaskCreated: 'TASK_CREATED',
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const IssueType = {
  STORY: 'STORY',
  TASK: 'TASK',
  BUG: 'BUG',
} as const;
export type IssueType = (typeof IssueType)[keyof typeof IssueType];
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'USER_MENTIONED';

//Models:
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  globalRole: GlobalRole;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userRole: 'PROJECT_ADMIN' | 'PROJECT_MEMBER' | 'PROJECT_VIEWER';
}

export interface ProjectMembership {
  id: number;
  userId: number;
  projectId: number;
  role: ProjectRole;
}

export interface ProjectMember extends ProjectMembership {
  email: string;
  username: string;
}

export interface Board {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: number;
  title: string;
  order: number;
  boardId: number;
  wipLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  columnId: number;
  description: string | null;
  order: number;
  issueType: IssueType;
  priority: Priority;
  parentId: number | null;
  assigneeId: number | null;
  reporterId: number;
  createdAt: string;
  updatedAt: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface TaskDetails extends Task {
  activityTimeline: import('./dtos').TimelineEntry[];
  reporter?: { id: number; username: string; avatar: string | null };
  assignee?: { id: number; username: string; avatar: string | null };
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}

export interface BoardDetails extends Board {
  columns: ColumnWithTasks[];
}

export interface Comment {
  id: number;
  content: string;
  taskId: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  taskId: number;
  userId: number;
  type: ActivityType;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface WorkflowTransition {
  id: number;
  projectId: number;
  boardId: number;
  fromColumnId: number;
  toColumnId: number;
}

export interface Notification {
  id: number;
  userId: number;
  taskId: number | null;
  taskTitle?: string | null;
  projectId?: number | null;
  boardId?: number | null;
  columnId?: number | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  message: string;
  type: 'assignment' | 'deadline' | 'comment';
  isRead: boolean;
  createdAt: string;
  projectId?: number; // So the user can click to go to the project
}
