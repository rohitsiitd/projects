import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Notification } from '../types/models';
import { notificationApi } from '../api/notification.api';
import styles from './Notifications.module.css';

// component for notification center
export const NotificationCenter = () => {
  const navigate = useNavigate();
  // state for notifications
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // load notifications and set interval
  useEffect(() => {
    const loadNotifications = async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true);
        const data = await notificationApi.getNotifications();
        setNotifications(data.notifications);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    void loadNotifications(true);
    const intervalId = setInterval(() => loadNotifications(false), 10000);
    return () => clearInterval(intervalId);
  }, []);

  // handle click and mark as read
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await notificationApi.markAsRead(String(notification.id));
        setNotifications((currentNotifications) =>
          currentNotifications.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }

    // Navigate to the board with task and column information as query parameters
    if (notification.projectId && notification.boardId) {
      const queryParams = new URLSearchParams();
      if (notification.taskId) {
        queryParams.append('taskId', String(notification.taskId));
      }
      if (notification.columnId) {
        queryParams.append('columnId', String(notification.columnId));
      }

      const url = `/project/${notification.projectId}/boards/${notification.boardId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      navigate(url);
    } else if (notification.projectId) {
      navigate(`/project/${notification.projectId}`);
    }
    setIsOpen(false);
  };

  // count unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // render notification center ui
  return (
    <div className={styles.container}>
      <button className={styles.bellBtn} onClick={() => setIsOpen(!isOpen)}>
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notifications</h3>
          </div>
          <div className={styles.list}>
            {isLoading ? (
              <p className={styles.emptyText}>Loading</p>
            ) : notifications.length === 0 ? (
              <p className={styles.emptyText}>No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(n)}
                  type="button"
                >
                  <p>{n.message}</p>
                  {n.taskTitle && (
                    <p className={styles.taskTitle}>{n.taskTitle}</p>
                  )}
                  <div className={styles.time}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
