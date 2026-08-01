import { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import type { User } from '../types/models';

interface UseOrganizationUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

// custom hook to fetch and manage organization users
export const useOrganizationUsers = ({
  page = 1,
  limit = 10,
  search = '',
}: UseOrganizationUsersOptions) => {
  // state variables for users loading error and pagination
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // fetch users when dependencies change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await usersApi.getUsers({ page, limit, search });
        setUsers(response.items);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } catch (err) {
        console.error('Failed to load organization users:', err);
        setError('Failed to load organization users.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsers();
  }, [limit, page, search]);

  // return state and data
  return {
    users,
    isLoading,
    error,
    totalPages,
    total,
  };
};
