import { useState } from 'react';
import { type Column, type WorkflowTransition } from '../types/models';
import { apiFetch } from '../api/client';
import styles from '../pages/ProjectBoard.module.css';
import sharedStyles from '../styles/index.module.css';

interface Props {
  projectId: string;
  boardId: string;
  columns: Column[];
  transitions: WorkflowTransition[];
  onClose: () => void;
  onUpdate: (transitions: WorkflowTransition[]) => void;
}

// modal component for workflow settings
export const WorkflowSettingsModal = ({
  projectId,
  boardId,
  columns,
  transitions,
  onClose,
  onUpdate,
}: Props) => {
  // state for workflow transitions
  const [fromCol, setFromCol] = useState<string>(
    columns[0]?.id ? String(columns[0].id) : '',
  );
  const [toCol, setToCol] = useState<string>(
    columns[1]?.id ? String(columns[1].id) : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // get column name by id
  const getColumnName = (id: number) =>
    columns.find((c) => c.id === id)?.title || 'Unknown Column';

  // handle adding new transition
  const handleAdd = async () => {
    if (!fromCol || !toCol) return;

    // check if transition already exists locally
    if (
      transitions.some(
        (t) =>
          String(t.fromColumnId) === fromCol && String(t.toColumnId) === toCol,
      )
    ) {
      alert('This transition is already allowed');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTransition = await apiFetch<WorkflowTransition>(
        `/projects/${projectId}/boards/${boardId}/workflows`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromColumnId: Number(fromCol),
            toColumnId: Number(toCol),
          }),
        },
      );
      onUpdate([...transitions, newTransition]);
    } catch (error) {
      console.error('Failed to add transition', error);
      alert(
        'Permission Denied Only Project Admins can modify workflow transitions',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle deleting transition
  const handleDelete = async (transitionId: number) => {
    try {
      await apiFetch(
        `/projects/${projectId}/boards/${boardId}/workflows/${transitionId}`,
        {
          method: 'DELETE',
        },
      );
      onUpdate(transitions.filter((t) => t.id !== transitionId));
    } catch (error) {
      console.error('Failed to delete transition', error);
      alert(
        'Permission Denied Only Project Admins can modify workflow transitions',
      );
    }
  };

  // render workflow settings ui
  return (
    <div className={sharedStyles.modalOverlay} onClick={onClose}>
      <div
        className={`${sharedStyles.modalCard} ${styles.workflowModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={sharedStyles.modalHeader}>
          <h3>Workflow Transitions</h3>
          <button
            className={sharedStyles.closeButton}
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles.workflowBody}>
          <p className={sharedStyles.formHint}>
            Define allowed task movements between columns
          </p>

          <ul className={styles.transitionList}>
            {transitions.map((t) => (
              <li key={t.id} className={styles.transitionItem}>
                <span className={styles.transitionLabel}>
                  {getColumnName(t.fromColumnId)}{' '}
                  <span className={styles.transitionArrow}>→</span>{' '}
                  {getColumnName(t.toColumnId)}
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  className={styles.transitionRemoveButton}
                >
                  Remove
                </button>
              </li>
            ))}
            {transitions.length === 0 && (
              <li className={sharedStyles.helperText}>
                No transitions defined yet
              </li>
            )}
          </ul>

          <div className={styles.transitionComposer}>
            <div
              className={`${sharedStyles.inputGroup} ${styles.transitionField}`}
            >
              <label>From</label>
              <select
                value={fromCol}
                onChange={(e) => setFromCol(e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div
              className={`${sharedStyles.inputGroup} ${styles.transitionField}`}
            >
              <label>To</label>
              <select value={toCol} onChange={(e) => setToCol(e.target.value)}>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className={`${sharedStyles.primaryButton} ${styles.transitionSubmitButton}`}
            >
              {isSubmitting ? '...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
