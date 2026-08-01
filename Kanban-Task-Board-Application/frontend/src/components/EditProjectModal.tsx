import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { type Project, type ProjectRole } from '../types/models';
import { projectApi } from '../api/project.api';
import sharedStyles from '../styles/index.module.css';
import { OrganizationUsersBrowser } from './OrganizationUsersBrowser';
import styles from './EditProjectModal.module.css';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: (updatedProject: Project) => void;
}

interface ProjectMemberPayload {
  email: string;
  role: ProjectRole;
}

// modal component to edit project details and members
export const EditProjectModal = ({
  project,
  onClose,
  onSuccess,
}: EditProjectModalProps) => {
  // state for project and members
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(true);

  const [initialMembers, setInitialMembers] = useState<ProjectMemberPayload[]>(
    [],
  );
  const [activeMembers, setActiveMembers] = useState<ProjectMemberPayload[]>(
    [],
  );
  const { user } = useAuth();
  const isGlobalAdmin = user?.globalRole === 'GLOBAL_ADMIN';

  // pagination setup
  const [membersPage, setMembersPage] = useState(1);
  const membersPerPage = 5;
  const totalMembersPages = Math.max(
    1,
    Math.ceil(activeMembers.length / membersPerPage),
  );
  const currentMembersPage = Math.min(membersPage, totalMembersPages);
  const startIndex = (currentMembersPage - 1) * membersPerPage;
  const visibleActiveMembers = activeMembers.slice(
    startIndex,
    startIndex + membersPerPage,
  );

  // fetch project members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      setIsMembersLoading(true);
      try {
        const data = await projectApi.getMembers(String(project.id));
        const members = data.members.map((member) => ({
          email: member.email,
          role: member.role,
        }));
        setInitialMembers(members);
        setActiveMembers(members);
      } catch (error) {
        console.error('Failed to load project members', error);
        alert('Failed to load project members Please try again');
      } finally {
        setIsMembersLoading(false);
      }
    };
    void fetchMembers();
  }, [project.id]);

  // handle adding organization user
  const handleAddOrganizationUser = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    if (
      activeMembers.some(
        (member) => member.email.toLowerCase() === normalizedEmail,
      )
    ) {
      alert('This user is already in the project');
      return;
    }
    setActiveMembers((prev) => [
      { email: normalizedEmail, role: 'PROJECT_MEMBER' },
      ...prev,
    ]);
    setMembersPage(1);
  };

  // handle removing member
  const handleRemoveMember = (emailToRemove: string) => {
    setActiveMembers(
      activeMembers.filter((member) => member.email !== emailToRemove),
    );
  };

  // handle member role change
  const handleRoleChange = (email: string, newRole: ProjectRole) => {
    setActiveMembers(
      activeMembers.map((m) =>
        m.email === email ? { ...m, role: newRole } : m,
      ),
    );
  };

  // submit project and member updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await projectApi.updateProject(String(project.id), {
        projectname: name,
        description,
      });

      const addedMembers = activeMembers.filter(
        (am) => !initialMembers.some((im) => im.email === am.email),
      );
      const removedMembers = initialMembers.filter(
        (im) => !activeMembers.some((am) => am.email === im.email),
      );
      const updatedMembers = activeMembers.filter((am) => {
        const initial = initialMembers.find((im) => im.email === am.email);
        return initial && initial.role !== am.role;
      });

      for (const member of addedMembers) {
        await projectApi.addMember(
          String(project.id),
          member.email,
          member.role,
        );
      }
      for (const member of removedMembers) {
        await projectApi.removeMember(String(project.id), member.email);
      }
      for (const member of updatedMembers) {
        await projectApi.updateMemberRole(
          String(project.id),
          member.email,
          member.role,
        );
      }

      // Determine if the current user's role changed or if they were removed
      const currentUserMember = activeMembers.find(
        (m) => m.email === user?.email,
      );
      const isCurrentUserRemoved =
        initialMembers.some((m) => m.email === user?.email) && !currentUserMember;

      onSuccess({
        ...project, // Keep the old fields (including original userRole if unmodified)
        ...data,    // Apply the updated name and description
        userRole: (isCurrentUserRemoved
          ? undefined
          : currentUserMember
            ? currentUserMember.role
            : project.userRole) as ProjectRole,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update project', error);
      alert('Failed to update project Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  // render edit project ui
  return (
    <div className={sharedStyles.modalOverlay}>
      <div className={sharedStyles.modalCard}>
        <h2 className={sharedStyles.cardTitle}>Edit Project</h2>
        <form className={sharedStyles.form} onSubmit={handleSubmit}>
          <div className={sharedStyles.fieldGroup}>
            <label>Project Name</label>
            <input
              type="text"
              className={sharedStyles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={sharedStyles.fieldGroup}>
            <label>Description</label>
            <textarea
              className={`${sharedStyles.input} ${sharedStyles.textarea}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <hr className={styles.separator} />
          <h3>Users in Project</h3>

          <OrganizationUsersBrowser
            title="Browse organization users and add them to this project"
            pageSize={10}
            emptyMessage="No available organization users found"
            filterUsers={(user) =>
              !activeMembers.some(
                (member) =>
                  member.email.toLowerCase() === user.email.toLowerCase(),
              )
            }
            renderAction={(user) => (
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => handleAddOrganizationUser(user.email)}
              >
                Add
              </button>
            )}
          />

          {isMembersLoading ? (
            <p className={styles.loadingText}>Loading team members</p>
          ) : (
            activeMembers.length > 0 && (
              <>
                <ul className={styles.memberList}>
                  {visibleActiveMembers.map((member) => (
                    <li key={member.email} className={styles.memberItem}>
                      <strong>{member.email}</strong>

                      <div className={styles.memberActions}>
                        <select
                          className={`${sharedStyles.input} ${styles.roleSelect} ${styles[member.role] || ''}`}
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.email,
                              e.target.value as ProjectRole,
                            )
                          }
                          disabled={member.role === 'PROJECT_ADMIN' && !isGlobalAdmin}
                        >
                          <option value="PROJECT_MEMBER">Member</option>
                          <option value="PROJECT_ADMIN">Admin</option>
                          <option value="PROJECT_VIEWER">Viewer</option>
                        </select>

                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleRemoveMember(member.email)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {totalMembersPages > 1 && (
                  <div
                    className={`${sharedStyles.inlineControls} ${styles.paginationControls}`}
                  >
                    <p className={sharedStyles.helperText}>
                      Page {currentMembersPage} of {totalMembersPages}
                    </p>
                    <div className={sharedStyles.inlineControls}>
                      <button
                        type="button"
                        className={sharedStyles.smallButton}
                        onClick={() =>
                          setMembersPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentMembersPage === 1}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className={sharedStyles.smallButton}
                        onClick={() =>
                          setMembersPage((p) =>
                            Math.min(totalMembersPages, p + 1),
                          )
                        }
                        disabled={currentMembersPage === totalMembersPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={sharedStyles.secondaryButton}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={sharedStyles.primaryButton}
              disabled={isLoading}
            >
              {isLoading ? 'Saving' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
