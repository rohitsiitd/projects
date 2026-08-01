import { prisma } from '../../lib/prisma.js';
import {
  CommentWithAuthor,
  AuditLogWithUser,
  TimelineEntry,
} from '../types/dtos.js';

//Sending notification to reporter and assignee while moving a task.
//Not notifying twice if both are same.
export const notifyStatusChanged = async (
  taskId: number,
  title: string,
  assigneeId: number | null,
  reporterId: number | null,
  userId: number,
): Promise<void> => {
  const usersToNotify = new Set<number>();

  // Not notifying who actually made the change:
  if (assigneeId && assigneeId !== userId) usersToNotify.add(assigneeId);
  if (reporterId && reporterId !== userId) usersToNotify.add(reporterId);

  const statusNotifications = Array.from(usersToNotify).map((targetUserId) => ({
    userId: targetUserId,
    taskId,
    type: 'STATUS_CHANGED' as const,
    message: `The status of "${title}" was updated.`,
  }));

  if (statusNotifications.length > 0) {
    await prisma.notification.createMany({ data: statusNotifications });
  }
};

//Sending notification to a assignee of new task:
export const notifyTaskAssigned = async (
  taskId: number,
  title: string,
  assigneeId: number,
  userId: number,
): Promise<void> => {
  // Only notify if someone else assigned it to them
  if (assigneeId !== userId) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        taskId,
        type: 'TASK_ASSIGNED',
        message: `You were assigned to: "${title}"`,
      },
    });
  }
};

//Merging comments and audit logs into single list for chronological order in UI.
export const buildActivityTimeline = (
  comments: CommentWithAuthor[],
  auditLogs: AuditLogWithUser[],
): TimelineEntry[] => {
  // Mapping comments to the flat TimelineEntry shape
  const mappedComments: TimelineEntry[] = comments.map((comment) => ({
    id: `comment-${comment.id}`,
    type: 'comment',
    content: comment.content,
    createdAt: comment.createdAt,
    user: comment.author,
  }));

  // Mapping audit logs to the flat TimelineEntry shape
  const mappedLogs: TimelineEntry[] = auditLogs.map((log) => ({
    id: `log-${log.id}`,
    type: 'auditLog',
    field: log.type,
    oldValue: log.oldValue,
    newValue: log.newValue,
    createdAt: log.createdAt,
    user: log.user,
  }));
  return [...mappedComments, ...mappedLogs].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
};
