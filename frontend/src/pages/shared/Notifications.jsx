import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../../components/Navbar';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notificationApi';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getMyNotifications().then(r => setNotifications(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (n) => {
    if (n.isRead) return;
    try {
      await markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    } catch {}
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(x => ({ ...x, isRead: true })));
      toast.success('All marked as read');
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <div>
              <h1 className="page-title">Notifications</h1>
              {unreadCount > 0 && <p className="page-subtitle">{unreadCount} unread alerts</p>}
            </div>
            {unreadCount > 0 && (
              <button className="btn btn-ghost" onClick={markAll}>
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : notifications.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '3rem' }}>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => markRead(n)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="notif-title">{n.title}</div>
                    {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
