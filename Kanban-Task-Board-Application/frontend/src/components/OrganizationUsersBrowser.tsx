import { useState, type ReactNode } from 'react';
import { useOrganizationUsers } from '../hooks/useOrganizationUsers';
import type { User } from '../types/models';
import styles from './OrganizationUsersBrowser.module.css';

interface Props {
  title?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
  filterUsers?: (user: User) => boolean;
  renderAction?: (user: User) => ReactNode;
}

export const OrganizationUsersBrowser = ({
  title,
  searchPlaceholder = 'Search users by name or email...',
  emptyMessage = 'No users found.',
  pageSize = 10,
  filterUsers,
  renderAction,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  //fetching a big list of users to avoid server pagination
  const { users, isLoading, error } = useOrganizationUsers({
    page: 1,
    limit: 1000,
    search: searchQuery,
  });

  //Filter non project user
  const allAvailableUsers = filterUsers ? users.filter(filterUsers) : users;

  //Page calculation and index
  const totalAvailable = allAvailableUsers.length;
  const calculatedTotalPages = Math.max(
    1,
    Math.ceil(totalAvailable / pageSize),
  );
  const currentPage = Math.min(page, calculatedTotalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleUsers = allAvailableUsers.slice(
    startIndex,
    startIndex + pageSize,
  );

  return (
    <div className={styles.browser}>
      {title ? <p className={styles.metaText}>{title}</p> : null}

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1); //default page is 1 for searching.
          }}
        />
      </div>

      <p className={styles.metaText}>
        {isLoading
          ? 'Loading users...'
          : `${totalAvailable} available users found`}
      </p>

      {error ? (
        <p className={styles.emptyState}>{error}</p>
      ) : isLoading ? (
        <p className={styles.emptyState}>Loading users...</p>
      ) : visibleUsers.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
      ) : (
        <ul className={styles.userList}>
          {visibleUsers.map((user) => (
            <li key={user.id} className={styles.userItem}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.username}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              {renderAction ? renderAction(user) : null}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.pagination}>
        <p className={styles.metaText}>
          Page {currentPage} of {calculatedTotalPages}
        </p>
        <div className={styles.pageButtons}>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </button>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() =>
              setPage(Math.min(calculatedTotalPages, currentPage + 1))
            }
            disabled={currentPage === calculatedTotalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
