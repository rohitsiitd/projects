import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { columnApi } from '../api/column.api';
import { type Column as Columntype } from '../types/models';
import Column from './Column';
import styles from './ProjectBoard.module.css';
import sharedStyles from '../styles/index.module.css';
import { CreateColumnModal } from '../components/CreateColumnModal';
import type { Task, WorkflowTransition, Project } from '../types/models';
import { taskApi } from '../api/tasks.api';
import { apiFetch } from '../api/client';
import { WorkflowSettingsModal } from '../components/WorkflowSettingsModal';
import { NotificationCenter } from '../components/Notification';

type ColumnWithStatus = Columntype & { status?: string };

// main board page component
export const BoardPage = () => {
  // hooks and state variables
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { boardId, projectId } = useParams<{
    projectId: string;
    boardId: string;
  }>();

  const [addModal, SetAddModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Columntype[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [loading, setLoading] = useState(false);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [projectRole, setProjectRole] = useState<string | null>(null);

  // handle creating new column
  const handleColumnCreator = (col: Columntype) => {
    setColumns((prev) => [...prev, col]);
    SetAddModal(false);
  };

  // handles parent story status sync on task creation
  const handleTaskCreator = (task: Task) => {
    setTasks((prev) => {
      const newTasksState = [...prev, task];

      if (task.parentId) {
        const parentId = task.parentId;
        const parentIndex = newTasksState.findIndex((t) => t.id === parentId);

        if (parentIndex !== -1) {
          const parent = newTasksState[parentIndex];
          const children = newTasksState.filter((t) => t.parentId === parentId);

          if (children.length > 0) {
            const childStatuses = children.map((c) => {
              const col = columns.find((col) => col.id === c.columnId);
              return (col as ColumnWithStatus | undefined)?.status || 'TODO';
            });

            const allDone = childStatuses.every((s) => s === 'DONE');
            const allTodo = childStatuses.every((s) => s === 'TODO');

            const targetStatus = allDone
              ? 'DONE'
              : allTodo
                ? 'TODO'
                : 'IN_PROGRESS';
            const derivedColumn =
              columns.find(
                (col) => (col as ColumnWithStatus).status === targetStatus,
              ) || columns[0];

            if (derivedColumn && parent.columnId !== derivedColumn.id) {
              newTasksState[parentIndex] = {
                ...parent,
                columnId: derivedColumn.id,
              };
            }
          }
        }
      }
      return newTasksState;
    });
  };

  // handle column updates
  const handleColumnUpdate = (updatedCol: Columntype) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === updatedCol.id ? updatedCol : c)),
    );
  };

  // handle task updates and parent status sync
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) => {
      const newTasksState = prev.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      );
      const oldTask = prev.find((t) => t.id === updatedTask.id);

      const parentIdsToSync = new Set<number>();
      if (oldTask?.parentId) parentIdsToSync.add(oldTask.parentId);
      if (updatedTask.parentId) parentIdsToSync.add(updatedTask.parentId);

      parentIdsToSync.forEach((parentId) => {
        const parentIndex = newTasksState.findIndex((t) => t.id === parentId);
        if (parentIndex !== -1) {
          const parent = newTasksState[parentIndex];
          const children = newTasksState.filter((t) => t.parentId === parentId);

          if (children.length > 0) {
            const childStatuses = children.map((c) => {
              const col = columns.find((col) => col.id === c.columnId);
              return (col as ColumnWithStatus | undefined)?.status || 'TODO';
            });

            const allDone = childStatuses.every((s) => s === 'DONE');
            const allTodo = childStatuses.every((s) => s === 'TODO');

            const targetStatus = allDone
              ? 'DONE'
              : allTodo
                ? 'TODO'
                : 'IN_PROGRESS';
            const derivedColumn =
              columns.find(
                (col) => (col as ColumnWithStatus).status === targetStatus,
              ) || columns[0];

            if (derivedColumn && parent.columnId !== derivedColumn.id) {
              newTasksState[parentIndex] = {
                ...parent,
                columnId: derivedColumn.id,
              };
            }
          }
        }
      });

      return newTasksState;
    });
  };

  // handles workflow transitions and parent story sync on drag
  const handleTaskMove = async (
    taskId: string,
    sourceColumnId: string,
    targetColumnId: string,
    newOrder: number,
  ) => {
    if (sourceColumnId !== targetColumnId) {
      const isValidTransition = transitions.some(
        (t) =>
          String(t.fromColumnId) === sourceColumnId &&
          String(t.toColumnId) === targetColumnId,
      );
      if (!isValidTransition) {
        alert(
          'Invalid workflow transition Moving to this column is not permitted',
        );
        return;
      }
    }

    const taskToMoveCheck = tasks.find((t) => String(t.id) === taskId);
    if (!taskToMoveCheck) return;

    const targetCol = columns.find((col) => String(col.id) === targetColumnId);
    const targetColTasks = tasks.filter(
      (t) => String(t.columnId) === targetColumnId && t.issueType !== 'STORY',
    );

    if (
      taskToMoveCheck.issueType !== 'STORY' &&
      targetCol?.wipLimit &&
      ((sourceColumnId !== targetColumnId &&
        targetColTasks.length >= targetCol.wipLimit) ||
        (sourceColumnId === targetColumnId &&
          targetColTasks.length > targetCol.wipLimit))
    ) {
      alert(`Wip Limit of Column ${targetCol.title} exceeded`);
      return;
    }

    setTasks((prev) => {
      const taskToMove = prev.find((t) => String(t.id) === taskId);
      if (!taskToMove) return prev;

      const otherTasks = prev.filter((t) => String(t.id) !== taskId);
      const modifiedTask = { ...taskToMove, columnId: Number(targetColumnId) };

      const targetColTasks = otherTasks
        .filter((t) => String(t.columnId) === targetColumnId)
        .sort((a, b) => a.order - b.order);

      targetColTasks.splice(newOrder, 0, modifiedTask);
      const finalizedTarget = targetColTasks.map((t, idx) => ({
        ...t,
        order: idx,
      }));
      const nonTargetTasks = otherTasks.filter(
        (t) => String(t.columnId) !== targetColumnId,
      );

      let newTasksState: Task[] = [];
      if (sourceColumnId !== targetColumnId) {
        const sourceColTasks = nonTargetTasks
          .filter((t) => String(t.columnId) === sourceColumnId)
          .sort((a, b) => a.order - b.order)
          .map((t, idx) => ({ ...t, order: idx }));
        const rest = nonTargetTasks.filter(
          (t) => String(t.columnId) !== sourceColumnId,
        );
        newTasksState = [...rest, ...sourceColTasks, ...finalizedTarget];
      } else {
        newTasksState = [...nonTargetTasks, ...finalizedTarget];
      }

      // update the parent storys column based on its childrens statuses
      if (modifiedTask.parentId) {
        const parentId = modifiedTask.parentId;
        const parentIndex = newTasksState.findIndex((t) => t.id === parentId);

        if (parentIndex !== -1) {
          const parent = newTasksState[parentIndex];
          const children = newTasksState.filter((t) => t.parentId === parentId);

          if (children.length > 0) {
            const childStatuses = children.map((c) => {
              const col = columns.find((col) => col.id === c.columnId);
              return (col as ColumnWithStatus | undefined)?.status || 'TODO';
            });

            const allDone = childStatuses.every((s) => s === 'DONE');
            const allTodo = childStatuses.every((s) => s === 'TODO');

            const targetStatus = allDone
              ? 'DONE'
              : allTodo
                ? 'TODO'
                : 'IN_PROGRESS';
            const derivedColumn =
              columns.find(
                (col) => (col as ColumnWithStatus).status === targetStatus,
              ) || columns[0];

            if (derivedColumn && parent.columnId !== derivedColumn.id) {
              newTasksState[parentIndex] = {
                ...parent,
                columnId: derivedColumn.id,
              };
            }
          }
        }
      }

      return newTasksState;
    });

    try {
      await taskApi.moveTask(
        projectId!,
        boardId!,
        sourceColumnId,
        taskId,
        targetColumnId,
        String(newOrder),
      );
    } catch (error) {
      console.error('Failed to move task', error);
    }
  };

  // handle dragging and moving columns
  const handleColumnMove = async (columnId: string, newOrder: number) => {
    const draggedCol = columns.find((c) => String(c.id) === columnId);
    if (!draggedCol || draggedCol.order === newOrder) return;

    setColumns((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex((c) => String(c.id) === columnId);
      if (oldIndex === -1) return prev;

      let targetIndex = sorted.findIndex((c) => c.order === newOrder);

      const [removed] = sorted.splice(oldIndex, 1);
      if (targetIndex === -1) targetIndex = sorted.length;

      sorted.splice(targetIndex, 0, removed);
      return sorted.map((c, i) => ({ ...c, order: i }));
    });

    try {
      await apiFetch(
        `/projects/${projectId}/boards/${boardId}/columns/${columnId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: newOrder }),
        },
      );
    } catch (error) {
      console.error('Failed to move column', error);
    }
  };

  // fetch board data on mount
  useEffect(() => {
    if (!boardId || !projectId) return;

    const fetchColumns = async () => {
      try {
        setLoading(true);
        const data = await columnApi.getColumns(projectId, boardId);
        setColumns(data);

        const taskPromises = data.map((col: Columntype) =>
          taskApi.getTasks(projectId!, boardId!, String(col.id)),
        );
        const results = await Promise.all(taskPromises);
        const allTasks = results.flat();
        setTasks(allTasks);

        const transData = await apiFetch<WorkflowTransition[]>(
          `/projects/${projectId}/boards/${boardId}/workflows`,
        );
        setTransitions(transData);

        const projectData = await apiFetch<{ projects: Project[] }>(
          `/projects/${projectId}`,
        );
        if (projectData.projects && projectData.projects.length > 0) {
          setProjectRole(projectData.projects[0].userRole);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchColumns();
  }, [boardId, projectId]);

  // handle navigation to task from notification
  // handle navigation to task from notification
  useEffect(() => {
    const taskIdParam = searchParams.get('taskId');

    if (taskIdParam) {
      const taskElement = document.getElementById(`task-${taskIdParam}`);
      if (taskElement) {
        // add visual highlight via css class
        taskElement.classList.add(styles.taskHighlight);
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // remove highlight class after 3 seconds
        const timeout = setTimeout(() => {
          taskElement.classList.remove(styles.taskHighlight);
        }, 3000);

        // clean up query params after navigation
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('taskId');
        newParams.delete('columnId');
        setSearchParams(newParams);

        return () => clearTimeout(timeout);
      }
    }
  }, [searchParams, setSearchParams]);

  // identify default columns
  const defaultColumnIds = columns
    .slice()
    .sort((a, b) => Number(a.id) - Number(b.id))
    .slice(0, 4)
    .map((c) => String(c.id));

  // handle deleting tasks
  const handleTaskDelete = async (taskId: string) => {
    try {
      const currTask = tasks.find((t) => String(t.id) === taskId);
      const columnId = String(currTask?.columnId);
      await taskApi.deleteTask(projectId!, boardId!, columnId!, taskId);

      setTasks((prev) => {
        const deletedTask = prev.find((t) => String(t.id) === taskId);
        const newTasksState = prev.filter((t) => String(t.id) !== taskId);

        if (deletedTask?.parentId) {
          const parentId = deletedTask.parentId;
          const parentIndex = newTasksState.findIndex((t) => t.id === parentId);

          if (parentIndex !== -1) {
            const parent = newTasksState[parentIndex];
            const children = newTasksState.filter(
              (t) => t.parentId === parentId,
            );

            if (children.length > 0) {
              const childStatuses = children.map((c) => {
                const col = columns.find((col) => col.id === c.columnId);
                return (col as ColumnWithStatus | undefined)?.status || 'TODO';
              });
              const allDone = childStatuses.every((s) => s === 'DONE');
              const allTodo = childStatuses.every((s) => s === 'TODO');
              const targetStatus = allDone
                ? 'DONE'
                : allTodo
                  ? 'TODO'
                  : 'IN_PROGRESS';
              const derivedColumn =
                columns.find(
                  (col) => (col as ColumnWithStatus).status === targetStatus,
                ) || columns[0];
              if (derivedColumn && parent.columnId !== derivedColumn.id) {
                newTasksState[parentIndex] = {
                  ...parent,
                  columnId: derivedColumn.id,
                };
              }
            }
          }
        }
        return newTasksState;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // handle deleting columns
  const handleColumnDelete = async (columnId: string) => {
    if (defaultColumnIds.includes(columnId)) {
      alert('Cannot delete default columns');
      return;
    }

    try {
      const val = tasks.filter((t) => String(t.columnId) === columnId);
      if (val.length !== 0) {
        alert('Column is Not empty');
        return;
      }
      await columnApi.deleteColumn(projectId!, boardId!, columnId);

      setColumns((prev) => prev.filter((c) => String(c.id) !== columnId));
      setTransitions((prev) =>
        prev.filter(
          (t) =>
            String(t.fromColumnId) !== columnId &&
            String(t.toColumnId) !== columnId,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className={styles.state}>Loading columns</div>;

  // render board page ui
  return (
    <div className={`${sharedStyles.pageShell} ${styles.page}`}>
      <header className={sharedStyles.pageTopBar}>
        <div className={styles.headerActions}>
          <button
            className={sharedStyles.backButton}
            onClick={() => navigate(`/project/${projectId}`)}
          >
            Back to Boards
          </button>
          {projectRole && (
            <span className={sharedStyles.tinyButton}>
              Role {projectRole.replace('PROJECT_', '')}
            </span>
          )}
        </div>

        <div className={styles.headerActions}>
          <NotificationCenter />
          <button
            className={sharedStyles.secondaryButton}
            onClick={() => setWorkflowModalOpen(true)}
          >
            Workflow Settings
          </button>
        </div>
      </header>

      <section className={sharedStyles.pageSplitHeader}>
        <div className={sharedStyles.pageTitleBlock}>
          <h1 className={sharedStyles.pageTitle}>Board Workflow</h1>
          <p className={sharedStyles.pageSubtitle}>
            Drag and drop tasks to update status
          </p>
        </div>
        <button
          className={sharedStyles.primaryButton}
          onClick={() => SetAddModal(!addModal)}
        >
          Add Column
        </button>
      </section>

      <div className={styles.section}>
        <div
          className={`${styles.boardScrollContainer} ${styles.boardCanvas}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dataStr = e.dataTransfer.getData('text/plain');
            if (!dataStr) return;
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'column') {
                handleColumnMove(data.columnId, columns.length);
              }
            } catch (err) {
              console.error(err);
            }
          }}
        >
          {columns.length === 0 ? (
            <div className={styles.emptyCard}>
              No columns defined for this board yet
            </div>
          ) : (
            [...columns]
              .sort((a, b) => a.order - b.order)
              .map((col) => (
                <div key={col.id} className={styles.columnWrapper}>
                  <Column
                    column={col}
                    isDefault={defaultColumnIds.includes(String(col.id))}
                    tasks={tasks.filter((t) => t.columnId === col.id)}
                    allTasks={tasks}
                    onTaskCreated={handleTaskCreator}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskMove={handleTaskMove}
                    onTaskDelete={handleTaskDelete}
                    onColumnDelete={handleColumnDelete}
                    onColumnMove={handleColumnMove}
                    onColumnUpdate={handleColumnUpdate}
                  />
                </div>
              ))
          )}
        </div>
      </div>

      {addModal && (
        <CreateColumnModal
          projectId={projectId!}
          nextOrder={columns.length}
          onClose={() => SetAddModal(false)}
          onSuccess={handleColumnCreator}
        />
      )}

      {workflowModalOpen && (
        <WorkflowSettingsModal
          projectId={projectId!}
          boardId={boardId!}
          columns={columns}
          transitions={transitions}
          onClose={() => setWorkflowModalOpen(false)}
          onUpdate={(newTransitions) => setTransitions(newTransitions)}
        />
      )}
    </div>
  );
};
