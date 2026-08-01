import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { type Column } from '../types/models';
import styles from '../styles/index.module.css';
import { apiFetch } from '../api/client';

interface EditColumnModalProps {
  column: Column;
  isDefault?: boolean;
  onClose: () => void;
  onSuccess: (updatedColumn: Column) => void;
}

type ColumnWithStatus = Column & { status?: string };

// modal component to edit an existing column
export const EditColumnModal = ({
  column,
  isDefault,
  onClose,
  onSuccess,
}: EditColumnModalProps) => {
  const { projectId, boardId } = useParams<{
    projectId: string;
    boardId: string;
  }>();

  // state for edit column form
  const [title, setTitle] = useState(column.title);
  const [status, setStatus] = useState<string>(
    (column as ColumnWithStatus).status || 'TODO',
  );
  const [wipLimit, setWipLimit] = useState<string>(
    column.wipLimit ? String(column.wipLimit) : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // handle column update submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !boardId || !projectId) return;

    if (
      isDefault &&
      status !== ((column as ColumnWithStatus).status || 'TODO')
    ) {
      alert('Cannot change the status of a default column');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updatedColumn = await apiFetch<Column>(
        `/projects/${projectId}/boards/${boardId}/columns/${column.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            wipLimit: wipLimit !== '' ? Number(wipLimit) : null,
            status,
          }),
        },
      );

      onSuccess(updatedColumn);
      onClose();
    } catch (err) {
      setError('Failed to update column');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // render modal ui
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Edit Column</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="title">Column Title</label>
            <input
              id="title"
              className={styles.input}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="status">Status Mapping</label>
            <select
              id="status"
              className={styles.input}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="wipLimit">WIP Limit</label>
            <input
              id="wipLimit"
              className={styles.input}
              type="number"
              min="1"
              value={wipLimit}
              onChange={(e) => setWipLimit(e.target.value)}
              placeholder="No limit"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

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
