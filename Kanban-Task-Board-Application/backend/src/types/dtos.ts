//Data transfer objects(DTOs) for our service parameters:
import { IssueType, Priority, Comment, AuditLog, User } from '@prisma/client';

export interface CreateBoardDTO {
  title: string;
  description?: string;
}

export interface CreateColumnDTO {
  title: string;
  order?: number | string;
  wipLimit?: number | string;
  status?: string;
}

export interface UpdateColumnDTO {
  title?: string;
  order?: number | string;
  wipLimit?: number | string;
  status?: string;
}

export interface TaskDTO {
  title: string;
  columnId: string | number;
  description?: string;
  issueType?: IssueType;
  priority?: Priority;
  assigneeId?: string | number;
  parentId?: string | number;
  dueDate?: string;
  order?: number;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  columnId?: string | number;
  issueType?: IssueType;
  priority?: Priority;
  assigneeId?: string | number | null;
  parentId?: string | number | null;
  dueDate?: string | null;
  order?: number;
}

export interface MoveTaskDTO {
  targetColumnId: string | number;
  newOrder: string | number;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'username' | 'avatar'>;
}

export interface AuditLogWithUser extends AuditLog {
  user: Pick<User, 'id' | 'username' | 'avatar'>;
}

export interface TimelineEntry {
  id: number | string;
  type: 'comment' | 'auditLog';
  content?: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: Date;
  user: Pick<User, 'id' | 'username' | 'avatar'>;
}
