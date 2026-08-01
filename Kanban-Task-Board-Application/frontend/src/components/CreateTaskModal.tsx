import { useEffect, useState } from 'react';
import { commentApi } from '../api/comment.api';
import { taskApi } from '../api/tasks.api';
import { projectApi } from '../api/project.api';
import { columnApi } from '../api/column.api';
import { IssueType, Priority, type ProjectMember } from '../types/models';
import type {
  CommentWithAuthor,
  TaskDTO,
  TimelineEntry,
  UpdateTaskDTO,
} from '../types/dtos';
import { useParams } from 'react-router-dom';
import { type Task, type User, type Column } from '../types/models';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/index.module.css';

interface Props {
  order: number;
  columnId: string;
  stories: Task[];
  wipLimit?: number | null;
  wipCount?: number;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  task?: Task;
}

export const CreateTaskModal = ({
  order,
  columnId,
  stories,
  wipLimit,
  wipCount,
  onClose,
  onSuccess,
  task,
}: Props) => {
  const { projectId, boardId } = useParams<{
    projectId: string;
    boardId: string;
  }>();
  const isEditing = Boolean(task);
  const { user } = useAuth();

  // Managing members
  const membersPerPage = 10;
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [membersPage, setMembersPage] = useState(1);

  // Managing columns for activity timeline formatting
  const [columns, setColumns] = useState<Column[]>([]);

  // Comments and timeline
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [reporterName, setReporterName] = useState<string | null>(null);

  // Edit and delete comments
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Main form
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    issueType: task?.issueType ?? IssueType.TASK,
    priority: task?.priority ?? Priority.Medium,
    assigneeId: task?.assigneeId ? String(task.assigneeId) : '',
    parentId: task?.parentId ? String(task.parentId) : '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });

  // Fetching project members for assignee
  useEffect(() => {
    if (!projectId) return;
    const loadMembers = async () => {
      try {
        setIsMembersLoading(true);
        const response = await projectApi.getMembers(projectId);
        setMembers(response.members);
      } catch (err) {
        console.error('Failed to load project members:', err);
      } finally {
        setIsMembersLoading(false);
      }
    };
    void loadMembers();
  }, [projectId]);

  // Fetching board columns for activity timeline formatting
  useEffect(() => {
    if (!projectId || !boardId) return;
    const loadColumns = async () => {
      try {
        const boardColumns = await columnApi.getColumns(projectId, boardId);
        setColumns(boardColumns);
      } catch (err) {
        console.error('Failed to load board columns:', err);
      }
    };
    void loadColumns();
  }, [projectId, boardId]);

  // Setting the correct task details as task change
  useEffect(() => {
    setForm({
      title: task?.title ?? '',
      description: task?.description ?? '',
      issueType: task?.issueType ?? IssueType.TASK,
      priority: task?.priority ?? Priority.Medium,
      assigneeId: task?.assigneeId ? String(task.assigneeId) : '',
      parentId: task?.parentId ? String(task.parentId) : '',
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    });
  }, [task]);

  // Fetching task comments and activity timeline
  useEffect(() => {
    if (!task || !projectId || !boardId) {
      setComments([]);
      setCommentInput('');
      setTimeline([]);
      setTimelineError(null);
      setIsTimelineLoading(false);
      setEditingCommentId(null);
      setReporterName(null);
      return;
    }

    const loadTaskDetails = async () => {
      try {
        setIsTimelineLoading(true);
        setTimelineError(null);
        const [taskDetails, taskComments] = await Promise.all([
          taskApi.getTask(projectId, boardId, columnId, String(task.id)),
          commentApi.getCommentsByTask(String(task.id), projectId),
        ]);
        setComments(taskComments);
        setTimeline(taskDetails.activityTimeline ?? []);
        setReporterName(taskDetails.reporter?.username ?? null);
      } catch (err) {
        console.error('Failed to load task activity timeline:', err);
        setTimelineError('Failed to load activity timeline.');
      } finally {
        setIsTimelineLoading(false);
      }
    };
    void loadTaskDetails();
  }, [task, projectId, boardId, columnId]);

  //fetching activity and comments any change in comment.
  const refreshTaskActivity = async () => {
    if (!task || !projectId || !boardId) return;
    try {
      const [taskDetails, taskComments] = await Promise.all([
        taskApi.getTask(projectId, boardId, columnId, String(task.id)),
        commentApi.getCommentsByTask(String(task.id), projectId),
      ]);
      setComments(taskComments);
      setTimeline(taskDetails.activityTimeline ?? []);
      setReporterName(taskDetails.reporter?.username ?? null);
    } catch (err) {
      console.error('Failed to refresh task activity:', err);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  //Rich text helpers:

  //Remove this:
  const stripHtml = (value: string) => {
    const doc = new DOMParser().parseFromString(value, 'text/html');
    return doc.body.textContent?.trim() ?? '';
  };

  const isCommentEmpty = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '').trim().length === 0;
  };

  // Expanded Native HTML tag injector
  const applyFormatting = (
    tag: string,
    elementId: string, //tag specific id
    currentValue: string,
    setValue: (val: string) => void, //react state update func. To save new text
  ) => {
    const textarea = document.getElementById(elementId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentValue.substring(start, end);
    let newText = '';
    if (tag === 'a') {
      //Asking link from the user:
      const url = prompt(
        'Enter the link URL (e.g., https://google.com):',
        'https://',
      );
      if (!url) return;
      newText =
        currentValue.substring(0, start) +
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText || 'link'}</a>` +
        currentValue.substring(end);
    } else if (tag === 'ul' || tag === 'ol') {
      const listItems = selectedText
        ? selectedText
            .split('\n')
            .map((line) => `<li>${line}</li>`)
            .join('\n')
        : '<li>List item</li>';
      newText =
        currentValue.substring(0, start) +
        `\n<${tag}>\n${listItems}\n</${tag}>\n` +
        currentValue.substring(end);
    } else {
      // For b, i, u, s, code, blockquote
      newText =
        currentValue.substring(0, start) +
        `<${tag}>${selectedText}</${tag}>` +
        currentValue.substring(end);
    }

    setValue(newText);
    setTimeout(() => textarea.focus(), 0);
  };

  //making prety for user:
  const formatTimelineEvent = (
    entry: TimelineEntry,
    projectMembers: ProjectMember[],
    boardColumns: Column[],
  ) => {
    // Helper to get username by userId
    const getUserName = (userId: string | null | undefined) => {
      if (!userId || userId === 'Unassigned') return 'Unassigned';
      const member = projectMembers.find((m) => String(m.userId) === userId);
      return member?.username || `User ${userId}`;
    };

    // Helper to get column title by columnId
    const getColumnTitle = (columnId: string | null | undefined) => {
      if (!columnId) return 'Unknown';
      const column = boardColumns.find((c) => String(c.id) === columnId);
      return column?.title || `Column ${columnId}`;
    };

    switch (entry.field) {
      case 'TASK_CREATED':
        return 'created this task.';
      case 'STATUS_CHANGE':
        return `changed status from ${getColumnTitle(entry.oldValue)} to ${getColumnTitle(entry.newValue)}.`;
      case 'ASSIGNEE_CHANGE':
        return `changed assignee from ${getUserName(entry.oldValue)} to ${getUserName(entry.newValue)}.`;
      case 'PRIORITY_CHANGE':
        return `changed priority from ${entry.oldValue ?? 'Unknown'} to ${entry.newValue ?? 'Unknown'}.`;
      case 'COMMENT_ADDED':
        return 'added a comment.';
      case 'COMMENT_EDITED':
        return 'edited a comment.';
      case 'COMMENT_DELETED':
        return 'deleted a comment.';
      default:
        return 'updated this task.';
    }
  };

  const handleAddComment = async () => {
    if (!task || !projectId || isCommentEmpty(commentInput)) return;
    try {
      setIsCommentSubmitting(true);
      const createdComment = await commentApi.createComment(
        String(task.id),
        projectId,
        {
          content: commentInput.trim(),
        },
      );
      setCommentInput('');
      setComments((prev) => [createdComment, ...prev]);
      await refreshTaskActivity();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (isCommentEmpty(editCommentContent) || !projectId || !task) return;
    try {
      await commentApi.updateComment(commentId, projectId, String(task.id), {
        content: editCommentContent.trim(),
      });
      setEditingCommentId(null);
      await refreshTaskActivity();
    } catch (err) {
      console.error('Failed to update comment:', err);
      alert('Failed to update comment.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!projectId || !task) return;
    if (!window.confirm('Are you sure you want to delete this comment?'))
      return;
    try {
      await commentApi.deleteComment(commentId, String(task.id), projectId);
      setComments((prev) => prev.filter((c) => String(c.id) !== commentId));
      await refreshTaskActivity();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Failed to delete comment.');
    }
  };

  //pages calculation and showing limited members per page so assignee selection:
  const totalMemberPages = Math.max(
    1,
    Math.ceil(members.length / membersPerPage),
  );
  const pageStart = (membersPage - 1) * membersPerPage;
  const pagedMembers = members.slice(pageStart, pageStart + membersPerPage);
  const selectedMember = members.find(
    (member) => String(member.userId) === form.assigneeId,
  );
  //keep the previosly
  const visibleMembers =
    selectedMember &&
    !pagedMembers.some((member) => member.userId === selectedMember.userId)
      ? [selectedMember, ...pagedMembers]
      : pagedMembers;

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }

    // Frontend WIP check before sending to backend
    if (
      !isEditing &&
      form.issueType !== IssueType.STORY &&
      wipLimit !== undefined &&
      wipLimit !== null
    ) {
      if (wipCount !== undefined && wipCount >= wipLimit) {
        alert(
          `WIP Limit Reached: This column cannot accept more than ${wipLimit} tasks.`,
        );
        return;
      }
    }

    setIsFormSubmitting(true);
    try {
      if (isEditing && task) {
        const payload = {
          ...form,
          columnId,
          assigneeId: form.assigneeId || null,
          parentId: form.parentId || null,
          dueDate: form.dueDate || null,
          order,
        } as UpdateTaskDTO;

        const updatedTask = await taskApi.updateTask(
          projectId!,
          boardId!,
          columnId,
          String(task.id),
          payload,
        );
        onSuccess(updatedTask);
      } else {
        const payload = {
          ...form,
          columnId,
          assigneeId: form.assigneeId || undefined,
          parentId: form.parentId || undefined,
          dueDate: form.dueDate || undefined,
          order,
        } as TaskDTO;
        const newTask = await taskApi.createTask(
          projectId!,
          boardId!,
          columnId,
          payload,
        );
        onSuccess(newTask);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const isStory = form.issueType === IssueType.STORY;

  return (
    <div className={styles.surfaceCard}>
      <h3 className={styles.cardTitle}>
        {isEditing ? 'Update Task' : 'Create Task'}
      </h3>

      <div className={styles.form}>
        {/* --- STANDARD TASK FIELDS --- */}
        <div className={styles.fieldGroup}>
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            className={styles.input}
            placeholder="Title"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Description"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-issue-type">Issue Type</label>
          <select
            id="task-issue-type"
            className={styles.input}
            value={form.issueType}
            onChange={(e) => handleChange('issueType', e.target.value)}
            disabled={isEditing && task?.issueType === IssueType.STORY}
          >
            {Object.values(IssueType).map((type) => {
              if (isEditing && task) {
                if (
                  task.issueType === IssueType.STORY &&
                  type !== IssueType.STORY
                )
                  return null;
                if (
                  task.issueType !== IssueType.STORY &&
                  type === IssueType.STORY
                )
                  return null;
              }
              return (
                <option key={type} value={type}>
                  {type}
                </option>
              );
            })}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            className={styles.input}
            value={form.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
          >
            {Object.values(Priority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {isEditing && reporterName && (
          <div className={styles.fieldGroup}>
            <label>Reporter</label>
            <input
              className={`${styles.input} ${styles.disabledInput}`}
              value={reporterName}
              disabled
            />
          </div>
        )}

        {!isStory && (
          <>
            <div className={styles.fieldGroup}>
              <label htmlFor="task-assignee">Assignee</label>
              <select
                id="task-assignee"
                className={styles.input}
                value={form.assigneeId}
                onChange={(e) => handleChange('assigneeId', e.target.value)}
                disabled={isMembersLoading}
              >
                <option value="">Unassigned</option>
                {visibleMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.username} ({member.email})
                  </option>
                ))}
              </select>

              {/* Pagination controls for members list */}
              <div className={styles.paginationControls}>
                <p className={styles.paginationText}>
                  {members.length === 0
                    ? 'No project users available.'
                    : `Showing ${Math.min(pageStart + 1, members.length)}-${Math.min(pageStart + membersPerPage, members.length)} of ${members.length} project users`}
                </p>
                <div className={styles.paginationButtons}>
                  <button
                    type="button"
                    className={styles.tinyButton}
                    onClick={() =>
                      setMembersPage((page) => Math.max(1, page - 1))
                    }
                    disabled={membersPage === 1 || isMembersLoading}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className={styles.tinyButton}
                    onClick={() =>
                      setMembersPage((page) =>
                        Math.min(totalMemberPages, page + 1),
                      )
                    }
                    disabled={
                      membersPage === totalMemberPages || isMembersLoading
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="task-parent">Parent Issue</label>
              <select
                id="task-parent"
                className={styles.input}
                value={form.parentId}
                onChange={(e) => handleChange('parentId', e.target.value)}
              >
                <option value="">None (Standalone)</option>
                {stories.map((story) => (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="task-due-date">Due Date</label>
          <input
            id="task-due-date"
            className={styles.input}
            type="date"
            value={form.dueDate}
            onChange={(e) => handleChange('dueDate', e.target.value)}
          />
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.primaryButton}
            onClick={handleSubmit}
            type="button"
            disabled={isFormSubmitting}
          >
            {isFormSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </button>
          <button
            className={styles.secondaryButton}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>

        {/* --- COMMENTS & TIMELINE SECTION --- */}
        {isEditing && (
          <section className={styles.timelineSection}>
            <h4 className={styles.timelineTitle}>Comments</h4>

            {/* CREATE NEW COMMENT COMPOSER */}
            <div className={styles.commentComposer}>
              {/* functionalities added for rich text support */}
              <div className={styles.richTextToolbar}>
                <button
                  type="button"
                  className={`${styles.richTextButton} ${styles.boldButton}`}
                  onClick={() =>
                    applyFormatting(
                      'b',
                      'create-comment-textarea',
                      commentInput,
                      setCommentInput,
                    )
                  }
                >
                  B
                </button>
                <button
                  type="button"
                  className={`${styles.richTextButton} ${styles.italicButton}`}
                  onClick={() =>
                    applyFormatting(
                      'i',
                      'create-comment-textarea',
                      commentInput,
                      setCommentInput,
                    )
                  }
                >
                  I
                </button>
                <button
                  type="button"
                  className={`${styles.richTextButton} ${styles.underlineButton}`}
                  onClick={() =>
                    applyFormatting(
                      'u',
                      'create-comment-textarea',
                      commentInput,
                      setCommentInput,
                    )
                  }
                >
                  U
                </button>
                <button
                  type="button"
                  className={`${styles.richTextButton} ${styles.strikethroughButton}`}
                  onClick={() =>
                    applyFormatting(
                      's',
                      'create-comment-textarea',
                      commentInput,
                      setCommentInput,
                    )
                  }
                >
                  S
                </button>
                <button
                  type="button"
                  className={`${styles.richTextButton} ${styles.codeButton}`}
                  onClick={() =>
                    applyFormatting(
                      'code',
                      'create-comment-textarea',
                      commentInput,
                      setCommentInput,
                    )
                  }
                >
                  &lt;/&gt;
                </button>
                <button
                  type="button"
                  className={styles.richTextButton}
                  onClick={() =>
                    applyFormatting(
                      'blockquote',
                      'create-comment-textarea',
                      commentInput,
                      setCommentInput,
                    )
                  }
                >
                  &quot;
                </button>
                <button
                  type="button"
                  className={styles.richTextButton}
                  onClick={() =>
                    applyFormatting(
                      'ul',
                      'create-comment-textarea',
                      commentInput,
                      setCommentInput,
                    )
                  }
                >
                  • List
                </button>
                <button
                  type="button"
                  className={styles.richTextButton}
                  onClick={() =>
                    applyFormatting(
                      'a',
                      'create-comment-textarea',
                      commentInput,
                      setCommentInput,
                    )
                  }
                >
                  🔗 Link
                </button>
              </div>

              <textarea
                id="create-comment-textarea"
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Add a comment... (Use toolbar to format)"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                rows={3}
              />
              <div className={styles.commentComposerActions}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={handleAddComment}
                  disabled={isCommentSubmitting || isCommentEmpty(commentInput)}
                >
                  {isCommentSubmitting ? 'Posting...' : 'Add Comment'}
                </button>
              </div>
            </div>

            {comments.length === 0 ? (
              <p className={styles.helperText}>No comments yet.</p>
            ) : (
              <div className={styles.timelineList}>
                {comments.map((comment) => {
                  const isMyComment =
                    user &&
                    (String(user.id) === String(comment.author.id) ||
                      String((user as User).id) === String(comment.author.id));

                  return (
                    <article key={comment.id} className={styles.timelineItem}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineAuthor}>
                          {comment.author.username}
                        </span>
                        <span className={styles.timelineDate}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* --- EDIT COMMENT RENDER --- */}
                      {editingCommentId === String(comment.id) ? (
                        <div className={styles.commentComposer}>
                          {/* Expanded rich text toolbar for editing comments */}
                          <div className={styles.richTextToolbar}>
                            {/* Bold button - demonstrates bold formatting */}
                            <button
                              type="button"
                              className={`${styles.richTextButton} ${styles.boldButton}`}
                              onClick={() =>
                                applyFormatting(
                                  'b',
                                  'edit-comment-textarea',
                                  editCommentContent,
                                  setEditCommentContent,
                                )
                              }
                            >
                              B
                            </button>
                            {/* Italic button - demonstrates italic formatting */}
                            <button
                              type="button"
                              className={`${styles.richTextButton} ${styles.italicButton}`}
                              onClick={() =>
                                applyFormatting(
                                  'i',
                                  'edit-comment-textarea',
                                  editCommentContent,
                                  setEditCommentContent,
                                )
                              }
                            >
                              I
                            </button>
                            {/* Underline button - demonstrates underline formatting */}
                            <button
                              type="button"
                              className={`${styles.richTextButton} ${styles.underlineButton}`}
                              onClick={() =>
                                applyFormatting(
                                  'u',
                                  'edit-comment-textarea',
                                  editCommentContent,
                                  setEditCommentContent,
                                )
                              }
                            >
                              U
                            </button>
                            {/* Strikethrough button - demonstrates strikethrough formatting */}
                            <button
                              type="button"
                              className={`${styles.richTextButton} ${styles.strikethroughButton}`}
                              onClick={() =>
                                applyFormatting(
                                  's',
                                  'edit-comment-textarea',
                                  editCommentContent,
                                  setEditCommentContent,
                                )
                              }
                            >
                              S
                            </button>
                            {/* Code button - demonstrates code/monospace formatting */}
                            <button
                              type="button"
                              className={`${styles.richTextButton} ${styles.codeButton}`}
                              onClick={() =>
                                applyFormatting(
                                  'code',
                                  'edit-comment-textarea',
                                  editCommentContent,
                                  setEditCommentContent,
                                )
                              }
                            >
                              &lt;/&gt;
                            </button>
                            {/* Blockquote button */}
                            <button
                              type="button"
                              className={styles.richTextButton}
                              onClick={() =>
                                applyFormatting(
                                  'blockquote',
                                  'edit-comment-textarea',
                                  editCommentContent,
                                  setEditCommentContent,
                                )
                              }
                            >
                              &quot;
                            </button>
                            {/* List button */}
                            <button
                              type="button"
                              className={styles.richTextButton}
                              onClick={() =>
                                applyFormatting(
                                  'ul',
                                  'edit-comment-textarea',
                                  editCommentContent,
                                  setEditCommentContent,
                                )
                              }
                            >
                              • List
                            </button>
                            {/* Link button */}
                            <button
                              type="button"
                              className={styles.richTextButton}
                              onClick={() =>
                                applyFormatting(
                                  'a',
                                  'edit-comment-textarea',
                                  editCommentContent,
                                  setEditCommentContent,
                                )
                              }
                            >
                              🔗 Link
                            </button>
                          </div>

                          <textarea
                            id="edit-comment-textarea"
                            className={`${styles.input} ${styles.textarea}`}
                            value={editCommentContent}
                            onChange={(e) =>
                              setEditCommentContent(e.target.value)
                            }
                            rows={3}
                          />
                          {/* Action buttons for saving or canceling comment edit */}
                          <div
                            className={`${styles.buttonRow} ${styles.editActionRow}`}
                          >
                            <button
                              className={styles.primaryButton}
                              type="button"
                              onClick={() =>
                                handleEditSubmit(String(comment.id))
                              }
                            >
                              Save
                            </button>
                            <button
                              className={styles.secondaryButton}
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* RENDER THE ACTUAL HTML SAFELY */}
                          <div
                            className={styles.timelineComment}
                            dangerouslySetInnerHTML={{
                              __html: comment.content,
                            }}
                          />

                          {/* Edit and delete buttons for user's own comments */}
                          {isMyComment && (
                            <div
                              className={`${styles.buttonRow} ${styles.editActionRow}`}
                            >
                              <button
                                type="button"
                                className={styles.smallButton}
                                onClick={() => {
                                  setEditingCommentId(String(comment.id));
                                  setEditCommentContent(comment.content); // Use actual content for editing
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`${styles.smallButton} ${styles.deleteActionButton}`}
                                onClick={() =>
                                  handleDeleteComment(String(comment.id))
                                }
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <h4 className={styles.timelineTitle}>Activity Timeline</h4>
            {isTimelineLoading ? (
              <p className={styles.helperText}>Loading activity...</p>
            ) : timelineError ? (
              <p className={styles.helperText}>{timelineError}</p>
            ) : timeline.length === 0 ? (
              <p className={styles.helperText}>No activity yet.</p>
            ) : (
              <div className={styles.timelineList}>
                {timeline.map((entry) => (
                  <article key={entry.id} className={styles.timelineItem}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineAuthor}>
                        {entry.user.username}
                      </span>
                      <span className={styles.timelineDate}>
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {entry.type === 'comment' ? (
                      <p className={styles.timelineComment}>
                        {/* STRIP HTML FOR THE PREVIEW TIMELINE */}
                        {stripHtml(entry.content ?? '') ||
                          'Comment content unavailable.'}
                      </p>
                    ) : (
                      <p className={styles.timelineEvent}>
                        {formatTimelineEvent(entry, members, columns)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
