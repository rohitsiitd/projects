import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type Column as ColumnType, type Task } from '../types/models';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { EditColumnModal } from '../components/EditColumnModal';
import pageStyles from './ProjectBoard.module.css';
import styles from './Column.module.css';
import modalStyles from '../styles/index.module.css';

type ColumnWithStatus = ColumnType & { status?: string };

interface Props {
  column: ColumnType;
  isDefault?: boolean;
  tasks: Task[];
  allTasks: Task[];
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskMove: (
    taskId: string,
    sourceColumnId: string,
    targetColumnId: string,
    newOrder: number,
  ) => void;
  onTaskDelete: (taskId: string) => void;
  onColumnDelete: (columnId: string) => void;
  onColumnMove?: (columnId: string, newOrder: number) => void;
  onColumnUpdate: (column: ColumnType) => void;
}

// main column component for kanban board
export default function Column({
  column,
  isDefault,
  tasks,
  allTasks,
  onTaskCreated,
  onTaskUpdated,
  onTaskMove,
  onTaskDelete,
  onColumnDelete,
  onColumnMove,
  onColumnUpdate,
}: Props) {
  // state for modals and selected tasks
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSubIssuesTask, setShowSubIssuesTask] = useState<Task | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // get active task from url or state
  const taskIdFromUrl = searchParams.get('taskId');
  const urlTask = taskIdFromUrl
    ? tasks.find((t) => String(t.id) === taskIdFromUrl)
    : null;

  const activeTask = selectedTask || urlTask;

  // handle closing task modal
  const handleCloseModal = () => {
    setSelectedTask(null);
    if (taskIdFromUrl) {
      searchParams.delete('taskId');
      setSearchParams(searchParams, { replace: true });
    }
  };

  // prevent body scroll when modal is open
  useEffect(() => {
    if (!activeTask) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeTask]);

  // handle drag and drop logic
  const handleDrop = (
    e: React.DragEvent<HTMLElement>,
    targetTask?: Task,
    isBelow?: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;

    const data = JSON.parse(dataStr);

    if (data.type === 'column' && onColumnMove) {
      onColumnMove(data.columnId, column.order);
      return;
    }

    const { taskId, sourceColumnId, sourceOrder } = data;
    if (!taskId) return;
    const targetColumnId = String(column.id);

    if (targetTask && String(targetTask.id) === String(taskId)) {
      return;
    }

    let newOrder = tasks.length;
    if (targetTask !== undefined) {
      const isSameColumn = String(sourceColumnId) === targetColumnId;
      if (isSameColumn && sourceOrder !== undefined) {
        if (sourceOrder < targetTask.order) {
          newOrder = isBelow ? targetTask.order : targetTask.order - 1;
        } else {
          newOrder = isBelow ? targetTask.order + 1 : targetTask.order;
        }
      } else {
        newOrder = isBelow ? targetTask.order + 1 : targetTask.order;
      }
    }

    onTaskMove(
      String(taskId),
      String(sourceColumnId),
      targetColumnId,
      Math.max(0, newOrder),
    );
  };

  // helper to strip html for plain text preview
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent?.trim() ?? '';
  };

  // calculate current wip count excluding stories
  const wipCount = tasks.filter((t) => t.issueType !== 'STORY').length;

  // render column ui
  return (
    <div
      className={styles.columnContainer}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          'text/plain',
          JSON.stringify({ type: 'column', columnId: String(column.id) }),
        );
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e)}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnHeading}>
          <h3 className={styles.columnTitle}>{column.title}</h3>
          {column.wipLimit !== null && (
            <span
              className={`${styles.wipBadge} ${wipCount > column.wipLimit ? styles.wipExceeded : ''}`}
            >
              WIP: {wipCount} / {column.wipLimit}
            </span>
          )}
        </div>

        <div className={styles.columnActions}>
          <button
            className={styles.iconActionBtn}
            onClick={() => setShowEditModal(true)}
          >
            Edit
          </button>
          <button
            className={`${styles.iconActionBtn} ${styles.deleteBtn}`}
            onClick={() => onColumnDelete(String(column.id))}
          >
            x
          </button>
        </div>
      </div>

      <div
        className={styles.taskList}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e)}
      >
        {tasks.length === 0 ? (
          <p className={`${modalStyles.helperText} ${styles.emptyColumnText}`}>
            No tasks yet
          </p>
        ) : (
          tasks.map((task) => (
            <article
              id={`task-${task.id}`}
              key={task.id}
              className={styles.taskCard}
              draggable
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const isBelowMidpoint = e.clientY > rect.top + rect.height / 2;
                handleDrop(e, task, isBelowMidpoint);
              }}
              onDragStart={(e) => {
                // prevent dragging stories directly
                if (task.issueType === 'STORY') {
                  e.preventDefault();
                  alert(
                    'Stories cannot be dragged directly They automatically follow their sub issues',
                  );
                  return;
                }
                e.stopPropagation();
                e.dataTransfer.setData(
                  'text/plain',
                  JSON.stringify({
                    type: 'task',
                    taskId: task.id,
                    sourceColumnId: task.columnId,
                    sourceOrder: task.order,
                  }),
                );
              }}
              onClick={() => setSelectedTask(task)}
            >
              <button
                className={styles.taskDeleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  // prevent deleting story with active sub issues
                  if (task.issueType === 'STORY') {
                    const hasChildren = allTasks.some(
                      (t) => t.parentId === task.id,
                    );
                    if (hasChildren) {
                      alert('Cannot delete a story that has active sub issues');
                      return;
                    }
                  }
                  onTaskDelete(String(task.id));
                }}
              >
                x
              </button>

              <div className={styles.taskMeta}>
                <span
                  className={
                    task.priority === 'CRITICAL'
                      ? styles.priorityCritical
                      : styles.priorityDefault
                  }
                >
                  {task.priority}
                </span>

                <span
                  className={
                    task.issueType === 'BUG'
                      ? styles.issueTypeBug
                      : task.issueType === 'STORY'
                        ? styles.issueTypeStory
                        : styles.issueTypeTask
                  }
                >
                  {task.issueType}
                </span>
              </div>

              <h4 className={styles.taskTitle}>{task.title}</h4>

              {task.description && (
                <p className={styles.taskDescription}>
                  {stripHtml(task.description)}
                </p>
              )}

              {/* render sub issues tracker for stories */}
              {task.issueType === 'STORY' && (
                <div className={styles.storyMeta}>
                  <span
                    className={`${styles.storyCountChip} ${styles.clickableChip}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSubIssuesTask(task);
                    }}
                  >
                    {allTasks.filter((t) => t.parentId === task.id).length} Sub
                    issues
                  </span>
                  <span className={styles.storyStatusChip}>
                    {(column as ColumnWithStatus).status || 'TODO'}
                  </span>
                </div>
              )}

              {/* render due date for normal tasks */}
              {task.issueType !== 'STORY' && task.dueDate && (
                <div className={styles.dueDate}>
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <div className={pageStyles.addTaskWrapper}>
        <button
          className={`${modalStyles.secondaryButton} ${modalStyles.fullWidth}`}
          onClick={() => {
            if (column.wipLimit !== null && wipCount >= column.wipLimit) {
              alert(
                `WIP limit of ${column.wipLimit} reached for ${column.title}`,
              );
              return;
            }
            setShowModal(!showModal);
          }}
        >
          Add another card
        </button>
      </div>

      {/* render create task modal */}
      {showModal && (
        <CreateTaskModal
          order={tasks.length}
          columnId={String(column.id)}
          wipLimit={column.wipLimit}
          wipCount={wipCount}
          stories={allTasks.filter((t) => t.issueType === 'STORY')}
          onClose={() => setShowModal(false)}
          onSuccess={onTaskCreated}
        />
      )}

      {/* render edit column modal */}
      {showEditModal && (
        <EditColumnModal
          column={column}
          isDefault={isDefault}
          onClose={() => setShowEditModal(false)}
          onSuccess={onColumnUpdate}
        />
      )}

      {/* render task details modal */}
      {activeTask && (
        <div className={modalStyles.modalOverlay} onClick={handleCloseModal}>
          <div
            className={modalStyles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <CreateTaskModal
              order={activeTask.order}
              columnId={String(column.id)}
              task={activeTask}
              wipLimit={column.wipLimit}
              wipCount={wipCount}
              stories={allTasks.filter((t) => t.issueType === 'STORY')}
              onClose={handleCloseModal}
              onSuccess={(updatedTask) => {
                onTaskUpdated(updatedTask);
                handleCloseModal();
              }}
            />
          </div>
        </div>
      )}

      {/* render sub issues read only modal */}
      {showSubIssuesTask && (
        <div
          className={modalStyles.modalOverlay}
          onClick={() => setShowSubIssuesTask(null)}
        >
          <div
            className={modalStyles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={modalStyles.modalHeader}>
              <h3>Sub issues for {showSubIssuesTask.title}</h3>
              <button
                className={modalStyles.closeButton}
                onClick={() => setShowSubIssuesTask(null)}
                type="button"
              >
                x
              </button>
            </div>
            <div
              className={`${modalStyles.timelineList} ${styles.subIssuesList}`}
            >
              {allTasks.filter((t) => t.parentId === showSubIssuesTask.id)
                .length === 0 ? (
                <p className={modalStyles.helperText}>No sub issues found</p>
              ) : (
                allTasks
                  .filter((t) => t.parentId === showSubIssuesTask.id)
                  .map((child) => (
                    <article
                      key={child.id}
                      className={modalStyles.timelineItem}
                    >
                      <div className={modalStyles.timelineHeader}>
                        <span className={modalStyles.timelineAuthor}>
                          {child.title}
                        </span>
                        <span className={modalStyles.timelineDate}>
                          {child.issueType} {child.priority}
                        </span>
                      </div>
                      {child.description && (
                        <p
                          className={`${modalStyles.timelineComment} ${styles.subIssueComment}`}
                        >
                          {stripHtml(child.description)}
                        </p>
                      )}
                    </article>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
