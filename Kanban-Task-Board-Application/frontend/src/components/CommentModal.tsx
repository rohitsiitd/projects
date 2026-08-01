import { useEffect, useRef, useState } from 'react';
import { commentApi } from '../api/comment.api';
import { projectApi } from '../api/project.api';
import { useAuth } from '../context/AuthContext';
import { type CommentWithAuthor } from '../types/dtos';
import { type ProjectMember, type Task } from '../types/models';
import styles from './CommentModal.module.css';

interface Props {
  task: Task;
  projectId: string;
  onClose: () => void;
}

// set of allowed html tags for rich text
const ALLOWED_TAGS = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'EM',
  'I',
  'LI',
  'OL',
  'P',
  'PRE',
  'STRONG',
  'U',
  'UL',
]);

// escapes html characters to prevent xss
const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

// sanitizes rich text input keeping only allowed tags
const sanitizeRichText = (value: string) => {
  if (!value.trim()) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${value}</div>`, 'text/html');
  const root = doc.body.firstElementChild;

  if (!root) {
    return '';
  }

  // recursive function to clean child nodes
  const sanitizeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent ?? '');
    }

    if (!(node instanceof HTMLElement)) {
      return '';
    }

    const tag = node.tagName.toUpperCase();
    const children = Array.from(node.childNodes).map(sanitizeNode).join('');

    if (!ALLOWED_TAGS.has(tag)) {
      return children;
    }

    if (tag === 'BR') {
      return '<br />';
    }

    if (tag === 'A') {
      const href = node.getAttribute('href')?.trim() ?? '';
      const safeHref =
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:')
          ? href
          : '';
      if (!safeHref) {
        return children;
      }
      return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noreferrer">${children}</a>`;
    }

    return `<${tag.toLowerCase()}>${children}</${tag.toLowerCase()}>`;
  };

  return Array.from(root.childNodes).map(sanitizeNode).join('').trim();
};

// extracts plain text from html string
const getPlainText = (value: string) => {
  if (!value.trim()) return '';

  const doc = new DOMParser().parseFromString(value, 'text/html');
  return doc.body.textContent?.replace(/\u00a0/g, ' ').trim() ?? '';
};

// normalizes empty editor value
const normalizeEditorValue = (value: string) => {
  const sanitized = sanitizeRichText(value);
  return sanitized === '<br />' ? '' : sanitized;
};

// main modal component for task comments
export const CommentModal = ({ task, projectId, onClose }: Props) => {
  const { user } = useAuth();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const editingRef = useRef<HTMLDivElement | null>(null);

  // component state variables
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // loads comments and members on mount
  useEffect(() => {
    const loadModalData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [taskComments, memberResponse] = await Promise.all([
          commentApi.getCommentsByTask(String(task.id), projectId),
          projectApi.getMembers(projectId),
        ]);
        setComments(taskComments);
        setMembers(memberResponse.members);
      } catch (err) {
        console.error(err);
        setError('Failed to load task comments.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadModalData();
  }, [projectId, task.id]);

  // updates composer html when content changes
  useEffect(() => {
    if (
      composerRef.current &&
      composerRef.current.innerHTML !== commentContent
    ) {
      composerRef.current.innerHTML = commentContent;
    }
  }, [commentContent]);

  // updates editing html when content changes
  useEffect(() => {
    if (editingRef.current && editingRef.current.innerHTML !== editingContent) {
      editingRef.current.innerHTML = editingContent;
    }
  }, [editingContent]);

  // sets focus to the end of the editor text
  const focusEditor = (editor: HTMLDivElement | null) => {
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // executes document formatting command
  const runFormatCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // applies formatting to the selected text
  const applyFormat = (
    command:
      | 'bold'
      | 'italic'
      | 'underline'
      | 'insertUnorderedList'
      | 'insertOrderedList',
    editor: HTMLDivElement | null,
  ) => {
    focusEditor(editor);
    runFormatCommand(command);
  };

  // prompts for url and inserts a link
  const applyLink = (editor: HTMLDivElement | null) => {
    focusEditor(editor);
    const url = window.prompt('Enter link URL');
    if (!url) return;
    runFormatCommand('createLink', url);
  };

  // syncs composer inner html to state
  const syncComposer = () => {
    setCommentContent(
      normalizeEditorValue(composerRef.current?.innerHTML ?? ''),
    );
  };

  // syncs editing inner html to state
  const syncEditing = () => {
    setEditingContent(
      normalizeEditorValue(editingRef.current?.innerHTML ?? ''),
    );
  };

  // inserts member mention into the composer
  const insertMention = (username: string) => {
    if (!username) return;

    focusEditor(composerRef.current);
    runFormatCommand('insertText', `@${username} `);
    syncComposer();
    setSelectedMember('');
  };

  // creates a new comment
  const handleCreateComment = async () => {
    const sanitizedContent = normalizeEditorValue(commentContent);
    if (!getPlainText(sanitizedContent)) return;

    try {
      setIsSubmittingComment(true);
      setError(null);
      const createdComment = await commentApi.createComment(
        String(task.id),
        projectId,
        {
          content: sanitizedContent,
        },
      );
      setComments((prev) => [createdComment, ...prev]);
      setCommentContent('');
      if (composerRef.current) {
        composerRef.current.innerHTML = '';
      }
    } catch (err) {
      console.error(err);
      setError('Failed to add comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // prepares comment for editing
  const startEditingComment = (comment: CommentWithAuthor) => {
    const sanitizedContent = normalizeEditorValue(comment.content);
    setEditingCommentId(comment.id);
    setEditingContent(sanitizedContent);
  };

  // cancels the editing mode
  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  // updates an existing comment
  const handleUpdateComment = async (commentId: number) => {
    const sanitizedContent = normalizeEditorValue(editingContent);
    if (!getPlainText(sanitizedContent)) return;

    try {
      setError(null);
      const updatedComment = await commentApi.updateComment(
        String(commentId),
        projectId,
        String(task.id),
        { content: sanitizedContent },
      );
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, ...updatedComment, author: comment.author }
            : comment,
        ),
      );
      cancelEditingComment();
    } catch (err) {
      console.error(err);
      setError('Failed to update comment.');
    }
  };

  // deletes a comment
  const handleDeleteComment = async (commentId: number) => {
    try {
      setError(null);
      await commentApi.deleteComment(
        String(commentId),
        String(task.id),
        projectId,
      );
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      if (editingCommentId === commentId) {
        cancelEditingComment();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete comment.');
    }
  };

  const commentText = getPlainText(commentContent);
  const editingText = getPlainText(editingContent);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        <div className={styles.headerBlock}>
          <p className={styles.kicker}>Task Comments</p>
          <h2 className={styles.modalTitle}>{task.title}</h2>
          {task.description ? (
            <p className={styles.taskDescription}>{task.description}</p>
          ) : (
            <p className={styles.mutedText}>
              No description added for this task yet.
            </p>
          )}
        </div>

        <h3 className={styles.sectionTitle}>Comments</h3>
        <div className={styles.commentComposer}>
          <div className={styles.composerToolbar}>
            <label
              className={styles.memberPickerLabel}
              htmlFor="comment-member"
            >
              Add user
            </label>
            <select
              id="comment-member"
              className={styles.memberPicker}
              value={selectedMember}
              onChange={(e) => {
                const username = e.target.value;
                setSelectedMember(username);
                if (username) {
                  insertMention(username);
                }
              }}
              disabled={isLoading || members.length === 0}
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.userId} value={member.username}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.richToolbar}>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => applyFormat('bold', composerRef.current)}
            >
              Bold
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => applyFormat('italic', composerRef.current)}
            >
              Italic
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => applyFormat('underline', composerRef.current)}
            >
              Underline
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() =>
                applyFormat('insertUnorderedList', composerRef.current)
              }
            >
              Bullet List
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() =>
                applyFormat('insertOrderedList', composerRef.current)
              }
            >
              Numbered List
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => applyLink(composerRef.current)}
            >
              Link
            </button>
          </div>

          <div
            ref={composerRef}
            className={styles.richEditor}
            contentEditable
            role="textbox"
            aria-multiline="true"
            data-placeholder="Write a rich comment or mention a teammate..."
            onInput={syncComposer}
            suppressContentEditableWarning
          />

          <div className={styles.commentActions}>
            <span className={styles.helperText}>
              {commentText.length} characters
            </span>
            <button
              className={styles.saveBtn}
              onClick={handleCreateComment}
              disabled={isSubmittingComment || !commentText}
            >
              {isSubmittingComment ? 'Posting...' : 'Add Comment'}
            </button>
          </div>
        </div>

        {error ? <p className={styles.mutedText}>{error}</p> : null}
        {isLoading ? (
          <p className={styles.mutedText}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className={styles.mutedText}>No comments yet.</p>
        ) : (
          <div className={styles.commentList}>
            {comments.map((comment) => {
              const isAuthor = user?.id === comment.author.id;
              const isEditing = editingCommentId === comment.id;
              const safeCommentHtml = sanitizeRichText(comment.content);

              return (
                <article key={comment.id} className={styles.commentCard}>
                  <div className={styles.commentHeader}>
                    <div>
                      <span className={styles.commentAuthor}>
                        {comment.author.username}
                      </span>
                      <p className={styles.commentMeta}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <>
                      <div className={styles.richToolbar}>
                        <button
                          type="button"
                          className={styles.toolbarBtn}
                          onClick={() =>
                            applyFormat('bold', editingRef.current)
                          }
                        >
                          Bold
                        </button>
                        <button
                          type="button"
                          className={styles.toolbarBtn}
                          onClick={() =>
                            applyFormat('italic', editingRef.current)
                          }
                        >
                          Italic
                        </button>
                        <button
                          type="button"
                          className={styles.toolbarBtn}
                          onClick={() =>
                            applyFormat('underline', editingRef.current)
                          }
                        >
                          Underline
                        </button>
                        <button
                          type="button"
                          className={styles.toolbarBtn}
                          onClick={() =>
                            applyFormat(
                              'insertUnorderedList',
                              editingRef.current,
                            )
                          }
                        >
                          Bullet List
                        </button>
                        <button
                          type="button"
                          className={styles.toolbarBtn}
                          onClick={() =>
                            applyFormat('insertOrderedList', editingRef.current)
                          }
                        >
                          Numbered List
                        </button>
                        <button
                          type="button"
                          className={styles.toolbarBtn}
                          onClick={() => applyLink(editingRef.current)}
                        >
                          Link
                        </button>
                      </div>
                      <div
                        ref={editingRef}
                        className={styles.richEditor}
                        contentEditable
                        role="textbox"
                        aria-multiline="true"
                        onInput={syncEditing}
                        suppressContentEditableWarning
                      />
                      <div className={styles.commentButtonRow}>
                        <span className={styles.helperText}>
                          {editingText.length} characters
                        </span>
                        <button
                          className={styles.ghostBtn}
                          onClick={cancelEditingComment}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={!editingText}
                        >
                          Save
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      className={styles.commentBody}
                      dangerouslySetInnerHTML={{ __html: safeCommentHtml }}
                    />
                  )}

                  {isAuthor && !isEditing ? (
                    <div className={styles.commentButtonRow}>
                      <button
                        className={styles.ghostBtn}
                        onClick={() => startEditingComment(comment)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.dangerTextBtn}
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
