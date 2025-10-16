import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notificationManager, type Notification } from '@/utils/notificationSystem';

export function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notification) => {
      setNotifications((prev) => [...prev, notification]);

      // Auto-remove after duration
      if (notification.duration) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
        }, notification.duration);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'error':
        return 'from-red-500/20 to-rose-500/20 border-red-500/30';
      case 'warning':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'info':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`bg-gradient-to-r ${getColors(notification.type)} border backdrop-blur-lg rounded-lg p-4 shadow-xl`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white mb-1">
                  {notification.title}
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {notification.message}
                </p>
                {notification.action && (
                  <button
                    onClick={notification.action.onClick}
                    className="mt-2 text-xs font-medium text-white hover:underline"
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
