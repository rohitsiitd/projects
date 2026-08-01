import { useState } from 'react';
import { type Project } from '../types/models';
import { projectApi } from '../api/project.api';
import styles from '../styles/index.module.css';

interface Props {
  onClose: () => void;
  onSuccess: (newProject: Project) => void;
}

// modal component to create a new project
export const CreateProjectModal = ({ onClose, onSuccess }: Props) => {
  // state for project form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      const data = await projectApi.createProject({
        projectname: name,
        description,
      });
      onSuccess(data.project);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong connecting to the server');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // render modal ui
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.cardTitle}>Create New Project</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="name">Project Name</label>
            <input
              id="name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className={`${styles.primaryButton} ${styles.fullWidth}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Project' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};
