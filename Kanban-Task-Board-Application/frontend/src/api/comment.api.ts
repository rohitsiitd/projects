import { apiFetch } from './client';
import { type CommentWithAuthor } from '../types/dtos';

export const commentApi = {
  getCommentsByTask: (
    taskId: string,
    projectId: string,
  ): Promise<CommentWithAuthor[]> =>
    apiFetch(`/projects/${projectId}/tasks/${taskId}/comments`),

  createComment: (
    taskId: string,
    projectId: string,
    data: {
      content: string;
    },
  ): Promise<CommentWithAuthor> =>
    apiFetch(`/projects/${projectId}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateComment: (
    commentId: string,
    projectId: string,
    taskId: string,
    data: {
      content: string;
    },
  ): Promise<CommentWithAuthor> =>
    apiFetch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteComment: (
    commentId: string,
    taskId: string,
    projectId: string,
  ): Promise<{ message: string }> =>
    apiFetch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
