import type { Task, TaskDetails } from '../types/models';
import { apiFetch } from './client';
import {
  type MoveTaskDTO,
  type TaskDTO,
  type UpdateTaskDTO,
} from '../types/dtos';

export const taskApi = {
  getTasks: (
    projectId: string,
    boardId: string,
    columnId: string,
  ): Promise<Task[]> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks`,
    ),

  getTask: (
    projectId: string,
    boardId: string,
    columnId: string,
    taskId: string,
  ): Promise<TaskDetails> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
    ),

  createTask: (
    projectId: string,
    boardId: string,
    columnId: string,
    data: Omit<TaskDTO, 'columnId'>,
  ): Promise<Task> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          columnId,
        }),
      },
    ),

  updateTask: (
    projectId: string,
    boardId: string,
    columnId: string,
    taskId: string,
    data: UpdateTaskDTO,
  ): Promise<Task> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    ),

  moveTask: (
    projectId: string,
    boardId: string,
    columnId: string,
    taskId: string,
    targetColumnId: string,
    newOrder: string | number,
  ): Promise<Task> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/move`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          targetColumnId,
          newOrder,
        } satisfies MoveTaskDTO),
      },
    ),

  deleteTask: (
    projectId: string,
    boardId: string,
    columnId: string,
    taskId: string,
  ): Promise<{ message: string; deletedTask: Task }> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
      {
        method: 'DELETE',
      },
    ),
};
