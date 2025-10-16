/**
 * Notification System for providing user feedback on AI operations
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationManager {
  private listeners: Set<(notification: Notification) => void> = new Set();

  subscribe(callback: (notification: Notification) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(notification: Omit<Notification, 'id'>) {
    const fullNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.listeners.forEach((listener) => listener(fullNotification));
  }

  success(title: string, message: string, action?: Notification['action']) {
    this.notify({
      type: 'success',
      title,
      message,
      duration: 3000,
      action,
    });
  }

  error(title: string, message: string, action?: Notification['action']) {
    this.notify({
      type: 'error',
      title,
      message,
      duration: 5000,
      action,
    });
  }

  warning(title: string, message: string, action?: Notification['action']) {
    this.notify({
      type: 'warning',
      title,
      message,
      duration: 4000,
      action,
    });
  }

  info(title: string, message: string, action?: Notification['action']) {
    this.notify({
      type: 'info',
      title,
      message,
      duration: 3000,
      action,
    });
  }
}

export const notificationManager = new NotificationManager();

