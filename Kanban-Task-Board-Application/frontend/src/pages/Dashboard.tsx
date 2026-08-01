import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type Project } from '../types/models';
import { projectApi } from '../api/project.api';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { NotificationCenter } from '../components/Notification';
import { getAvatarSrc, getInitials } from '../utils/avatar';
import { EditProjectModal } from '../components/EditProjectModal';
import { ManageUsersModal } from '../components/ManageUsersModal';
import styles from './Dashboard.module.css';

// main dashboard component
export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // state for projects and modals
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);

  // check if user is global admin
  const isGlobalAdmin = () => {
    if (!user) return false;
    else if (user.globalRole === 'GLOBAL_ADMIN') return true;
    else return false;
  };

  // check if user has admin rights for project
  const isAdmin = (project: Project) => {
    if (isGlobalAdmin()) return true;
    if (project.userRole === 'PROJECT_ADMIN') return true;
    else return false;
  };

  // handle user logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // add new project to state
  const handleCreateProject = async (newProject: Project) => {
    setAllProjects((prevProjects) => [newProject, ...prevProjects]);
  };

  // update edited project in state
  const handleUpdateSuccess = (updatedProject: Project) => {
    setAllProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      ),
    );
  };

  // handle archiving a project
  const handleArchiveProject = async (projectId: string | number) => {
    try {
      await projectApi.archiveProject(String(projectId));
      setAllProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId ? { ...project, archived: true } : project,
        ),
      );
    } catch (error) {
      console.error('Failed to archieve project', error);
      alert('Failed to archieve project Please try again later');
    }
  };

  // handle unarchiving a project
  const handleUnarchiveProject = async (projectId: string | number) => {
    try {
      await projectApi.unarchiveProject(String(projectId));
      setAllProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId ? { ...project, archived: false } : project,
        ),
      );
    } catch (error) {
      console.error('Failed to unarchive project', error);
      alert('Failed to unarchive project Please try again later');
    }
  };

  // handle permanent project deletion
  const handleDeleteProject = async (projectId: string | number) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this project',
      )
    )
      return;
    try {
      await projectApi.deleteProject(String(projectId));
      setAllProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project', error);
      alert('Failed to delete project Please try again later');
    }
  };

  // fetch all projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectApi.getProjects();
        setAllProjects(data.projects);
      } catch (error) {
        console.error('Failed to load projects', error);
      }
    };
    loadProjects();
  }, []);

  const displayedProjects = allProjects.filter((p) =>
    showArchived ? p.archived : !p.archived,
  );

  const avatarSrc = getAvatarSrc(user?.avatar);

  // render dashboard ui
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {isGlobalAdmin() && (
          <div className={styles.adminActions}>
            <button
              className={styles.newProjectBtn}
              onClick={() => setIsModalOpen(true)}
            >
              + New Project
            </button>
            <button
              className={styles.newProjectBtn}
              onClick={() => setIsManageUsersOpen(true)}
            >
              Manage Users
            </button>
          </div>
        )}
        <div className={styles.actions}>
          <button
            className={`${styles.newProjectBtn} ${showArchived ? styles.archiveToggleActive : ''}`}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Active Projects' : 'Archived Projects'}
          </button>
          <NotificationCenter />
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
          <button
            className={styles.avatarCircle}
            onClick={() => navigate('/profile')}
          >
            {avatarSrc ? (
              <img
                className={styles.avatarImage}
                src={avatarSrc}
                alt={`${user?.username || 'User'} avatar`}
              />
            ) : (
              getInitials(user?.username)
            )}
          </button>
        </div>
      </header>

      <main>
        <h2>{showArchived ? 'Archived Projects' : 'My Projects'}</h2>
        {displayedProjects.length === 0 ? (
          <p>
            {showArchived
              ? 'No archived projects'
              : 'You dont have any projects yet Click New Project to start'}
          </p>
        ) : (
          <div className={styles.projectGrid}>
            {displayedProjects.map((project) => (
              <div key={project.id} className={styles.projectCardWrapper}>
                <Link
                  to={`/project/${project.id}`}
                  className={styles.projectCard}
                >
                  <h3>{project.name}</h3>
                </Link>
                <p className={styles.projectDesc}>
                  {project.description || 'No description provided'}
                </p>
                <div className={styles.projectMeta}>
                  <p>Created {new Date(project.createdAt).toLocaleString()}</p>
                  <p>Updated {new Date(project.updatedAt).toLocaleString()}</p>
                </div>
                {!showArchived && (isAdmin(project) || project.createdById === user?.id) && (
                  <div className={styles.cardActions}>
                    {isAdmin(project) && (
                      <button
                        onClick={() => setEditingProject(project)}
                        className={styles.editBtn}
                      >
                        Edit
                      </button>
                    )}
                    {project.createdById === user?.id && (
                      <>
                        <button
                          onClick={() => handleArchiveProject(project.id)}
                          className={styles.editBtn}
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className={styles.archieveBtn}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
                {showArchived && project.createdById === user?.id && (
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => handleUnarchiveProject(project.id)}
                      className={styles.editBtn}
                    >
                      Unarchive
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className={styles.archieveBtn}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateProject}
        />
      )}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}
      {isManageUsersOpen && (
        <ManageUsersModal onClose={() => setIsManageUsersOpen(false)} />
      )}
    </div>
  );
};
