import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardApi } from '../api/boards.api';
import { type Board } from '../types/models';
import { CreateBoardModal } from '../components/CreateBoardModal';
import { NotificationCenter } from '../components/Notification';
import { EditBoardModal } from '../components/EditBoardModal';
import { apiFetch } from '../api/client';
import styles from './ProjectBoard.module.css';
import sharedStyles from '../styles/index.module.css';

// project boards overview component
export const ProjectBoard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // state for boards and modals
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  // handle creating a new board
  const handleCreateBoard = (newBoard: Board) => {
    setBoards((prev) => [newBoard, ...prev]);
    setIsModalOpen(false);
  };

  // handle updating an existing board
  const handleUpdateBoard = (updatedBoard: Board) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)),
    );
  };

  // handle deleting a board
  const handleDeleteBoard = async (
    e: React.MouseEvent,
    boardId: string | number,
  ) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this board')) return;
    try {
      await apiFetch(`/projects/${projectId}/boards/${boardId}`, {
        method: 'DELETE',
      });
      setBoards((prev) => prev.filter((b) => String(b.id) !== String(boardId)));
    } catch (err) {
      console.error(err);
      alert('Failed to delete board');
    }
  };

  // fetch project boards on mount
  useEffect(() => {
    if (!projectId) return;

    const fetchBoards = async () => {
      try {
        setLoading(true);
        const data = await boardApi.getBoardsByProject(projectId);
        setBoards(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load boards');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [projectId]);

  if (loading) return <div className={styles.state}>Loading boards</div>;
  if (error) return <div className={styles.state}>{error}</div>;

  // render boards list ui
  return (
    <div className={`${sharedStyles.pageShell} ${styles.page}`}>
      <header className={sharedStyles.pageTopBar}>
        <button
          className={sharedStyles.backButton}
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </button>
        <NotificationCenter />
      </header>

      <section className={sharedStyles.pageSplitHeader}>
        <div className={sharedStyles.pageTitleBlock}>
          <h1 className={sharedStyles.pageTitle}>Project Boards</h1>
          <p className={sharedStyles.pageSubtitle}>
            Manage and organize your team workflows
          </p>
        </div>
        <button
          className={sharedStyles.primaryButton}
          onClick={() => setIsModalOpen(true)}
        >
          New Board
        </button>
      </section>

      <div className={styles.section}>
        {boards.length === 0 ? (
          <div className={styles.emptyCard}>
            No boards found Create a new board to get started
          </div>
        ) : (
          <div className={styles.boardGrid}>
            {boards.map((board) => (
              <article
                key={board.id}
                className={`${styles.boardCard} ${styles.clickableCard}`}
                onClick={() =>
                  navigate(`/project/${projectId}/boards/${board.id}`)
                }
              >
                <div className={styles.boardCardHeader}>
                  <h3>{board.title}</h3>
                </div>
                <p>{board.description || 'No description provided'}</p>
                <div className={styles.boardCardActions}>
                  <button
                    className={sharedStyles.tinyButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBoard(board);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className={`${sharedStyles.tinyButton} ${sharedStyles.deleteActionButton}`}
                    onClick={(e) => handleDeleteBoard(e, board.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateBoardModal
          projectId={projectId!}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateBoard}
        />
      )}

      {editingBoard && (
        <EditBoardModal
          projectId={projectId!}
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
          onSuccess={handleUpdateBoard}
        />
      )}
    </div>
  );
};
