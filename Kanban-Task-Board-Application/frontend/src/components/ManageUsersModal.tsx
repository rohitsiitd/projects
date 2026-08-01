import { useState } from 'react';
import { adminApi } from '../api/admin.api';
import { type User } from '../types/models';
import { OrganizationUsersBrowser } from './OrganizationUsersBrowser';
import styles from './ManageUsersModal.module.css';

interface ManageUsersModalProps {
  onClose: () => void;
}

// modal component to manage users and roles
export const ManageUsersModal = ({ onClose }: ManageUsersModalProps) => {
  // state for role overrides
  const [roleOverrides, setRoleOverrides] = useState<
    Record<number, User['globalRole']>
  >({});

  // handle updating user global role
  const handleRoleChange = async (
    userId: string | number,
    newRole: 'GLOBAL_ADMIN' | 'USER',
  ) => {
    try {
      setRoleOverrides((prev) => ({ ...prev, [Number(userId)]: newRole }));

      await adminApi.updateUserGlobalRole(userId, newRole);
    } catch (error) {
      console.error('Failed to update role', error);
      alert('Failed to update user role Please try again');
    }
  };

  // render manage users modal
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Manage System Users</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <OrganizationUsersBrowser
          pageSize={10}
          renderAction={(user) => (
            <select
              className={styles.roleSelect}
              value={roleOverrides[user.id] ?? user.globalRole}
              onChange={(e) =>
                handleRoleChange(
                  user.id,
                  e.target.value as 'GLOBAL_ADMIN' | 'USER',
                )
              }
            >
              <option value="USER">User</option>
              <option value="GLOBAL_ADMIN">Global Admin</option>
            </select>
          )}
        />
      </div>
    </div>
  );
};
