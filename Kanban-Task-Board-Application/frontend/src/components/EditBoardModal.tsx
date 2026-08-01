import React, { useState } from 'react';
import { type Board } from '../types/models';
import { apiFetch } from '../api/client';
import styles from '../styles/index.module.css';

interface Props {
  projectId: string;
  board: Board;
  onClose: () => void;
  onSuccess: (updatedBoard: Board) => void;
}

// modal component to edit an existing board
export const EditBoardModal = ({
  projectId,
  board,
  onClose,
  onSuccess,
}: Props) => {
  // state for edit board form
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // handle board update submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedBoard = await apiFetch<Board>(
        `/projects/${projectId}/boards/${board.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), description }),
        },
      );
      onSuccess(updatedBoard);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to update board Please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  // render modal ui
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.cardTitle}>Edit Board</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="edit-board-title">Board name</label>
            <input
              id="edit-board-title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Board name"
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="edit-board-description">Description</label>
            <input
              id="edit-board-description"
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
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Saving' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
