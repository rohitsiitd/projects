import { useState } from 'react';
import { boardApi } from '../api/boards.api';
import { type Board } from '../types/models';
import styles from '../styles/index.module.css';

interface Props {
  projectId: string;
  onClose: () => void;
  onSuccess: (newBoard: Board) => void;
}

// modal component to create a new board
export const CreateBoardModal = ({ projectId, onClose, onSuccess }: Props) => {
  // state for board form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState(' ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      const data = await boardApi.createBoard(projectId, {
        title: name,
        description,
      });
      onSuccess(data);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // render modal ui
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.cardTitle}>Create Board</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="board-name">Board name</label>
            <input
              id="board-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Board name"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="board-description">Description</label>
            <input
              id="board-description"
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
