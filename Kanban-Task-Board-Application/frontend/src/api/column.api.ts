import { apiFetch } from './client';
import { type Column, type ColumnWithTasks } from '../types/models';
import { type CreateColumnDTO } from '../types/dtos';
export const columnApi = {
  getColumns: (
    projectId: string,
    boardId: string,
  ): Promise<ColumnWithTasks[]> =>
    apiFetch(`/projects/${projectId}/boards/${boardId}/columns`),

  createColumn: (
    projectId: string,
    boardId: string,
    data: CreateColumnDTO,
  ): Promise<Column> =>
    apiFetch(`/projects/${projectId}/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteColumn: (
    projectId: string,
    boardId: string,
    columnId: string,
  ): Promise<void> =>
    apiFetch(`/projects/${projectId}/boards/${boardId}/columns/${columnId}`, {
      method: 'DELETE',
    }),
};
