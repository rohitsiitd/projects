import { apiFetch } from './client';
import {
  type Project,
  type ProjectMember,
  type ProjectMembership,
} from '../types/models';

export const projectApi = {
  getProjects: (): Promise<{ projects: Project[] }> => apiFetch('/projects'),

  createProject: (data: {
    projectname: string;
    description?: string;
  }): Promise<{ message: string; project: Project }> =>
    apiFetch(`/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProject: (projectId?: string): Promise<{ projects: Project[] }> =>
    apiFetch(projectId ? `/projects/${projectId}` : '/projects'),

  updateProject: (
    projectId: string,
    data: {
      projectname: string;
      description?: string;
    },
  ): Promise<Project> =>
    apiFetch(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProject: (projectId: string): Promise<{ message: string }> =>
    apiFetch(`/projects/${projectId}`, {
      method: 'DELETE',
    }),

  getMembers: (projectId: string): Promise<{ members: ProjectMember[] }> =>
    apiFetch(`/projects/${projectId}/members`),

  archiveProject: (projectId: string): Promise<Project> =>
    apiFetch(`/projects/${projectId}/archive`, {
      method: 'POST',
    }),

  unarchiveProject: (projectId: string): Promise<Project> =>
    apiFetch(`/projects/${projectId}/unarchive`, {
      method: 'POST',
    }),
  addMember: (
    projectId: string,
    email: string,
    role: string,
  ): Promise<{ message: string; membership: ProjectMembership }> =>
    apiFetch(`/projects/${projectId}/members/${email}`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  removeMember: (
    projectId: string,
    email: string,
  ): Promise<{ message: string }> =>
    apiFetch(`/projects/${projectId}/members/${email}`, {
      method: 'DELETE',
    }),

  updateMemberRole: (
    projectId: string,
    email: string,
    role: string,
  ): Promise<{ message: string }> =>
    apiFetch(`/projects/${projectId}/members/${email}/`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
};
