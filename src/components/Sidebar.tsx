import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Users, UtensilsCrossed, User, Bell, LogOut, MessageSquare } from 'lucide-react';
import api from '../services/api';

interface Notification {
  id: number;
  type: string;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
  actor_id: number;
  actor_name: string;
  actor_avatar: string | null;
}

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (val: boolean) => void }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifs = async () => {
        try {
          const res = await api.get('notifications.php');
          if (res.data.status === 'success') {
            setNotifications(res.data.data.notifications);
            setUnreadCount(res.data.data.unread_count);
          }
        } catch (e) { console.error(e); }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, showDropdown]);

  const markAsRead = async (id: number) => {
    try {
      await api.post('notifications.php', { notification_id: id });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (e) { }
  };

  const markAllRead = async () => {
    try {
      await api.post('notifications.php', {});
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) { }
  };

  if (!isAuthenticated) return null;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '2.5rem 1.5rem', gap: '0.2rem' }}>
        {!collapsed ? (
          <>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>Terminus</h2>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>ACADEMIC SOCIAL<br/>ARCHITECTURE</div>
          </>
        ) : (
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>T</h2>
        )}
      </div>

      <div style={{ padding: '0 1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }} className="desktop-only">
        <button onClick={() => setCollapsed(!collapsed)} style={{ color: 'var(--text-muted)', background: 'var(--bg-color)', padding: '0.4rem', borderRadius: '8px' }}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <div className="sidebar-links">
        <Link to="/feed" className={`sidebar-item hoverable ${location.pathname === '/feed' ? 'active' : ''}`}>
          <span className="sidebar-icon"><Layers size={20} /></span>
          {!collapsed && <span>My Feed</span>}
        </Link>
        <Link to="/community" className={`sidebar-item hoverable ${location.pathname === '/community' ? 'active' : ''}`}>
          <span className="sidebar-icon"><Users size={20} /></span>
          {!collapsed && <span>Community</span>}
        </Link>
        <Link to="/mess" className={`sidebar-item hoverable ${location.pathname === '/mess' ? 'active' : ''}`}>
          <span className="sidebar-icon"><UtensilsCrossed size={20} /></span>
          {!collapsed && <span>Mess Routine</span>}
        </Link>
        <Link to="/chat" className={`sidebar-item hoverable ${location.pathname === '/chat' ? 'active' : ''}`}>
          <span className="sidebar-icon"><MessageSquare size={20} /></span>
          {!collapsed && <span>Messages</span>}
        </Link>
        <Link to="/profile" className={`sidebar-item hoverable ${location.pathname === '/profile' ? 'active' : ''}`}>
          <span className="sidebar-icon"><User size={20} /></span>
          {!collapsed && <span>Profile</span>}
        </Link>

        <div ref={triggerRef} className="sidebar-item hoverable" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowDropdown(!showDropdown)}>
          <span className="sidebar-icon" style={{ position: 'relative' }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </span>
          {!collapsed && <span>Notifications</span>}
        </div>
      </div>

      {/* Notifications Dropdown (Rendered outside sidebar-item to escape overflow hidden) */}
      {showDropdown && (
        <div ref={dropdownRef} className="glass-panel animate-fade-up notifications-dropdown">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Notifications</h4>
            {unreadCount > 0 && <span onClick={(e) => { e.stopPropagation(); markAllRead(); }} style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }}>Mark all read</span>}
          </div>

          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No notifications yet.</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} onClick={(e) => {
                e.stopPropagation();
                markAsRead(n.id);
                setShowDropdown(false);
                if (n.type === 'follow') {
                  navigate(`/profile/${n.actor_id}`);
                } else {
                  navigate(`/feed`);
                }
              }} style={{
                padding: '0.75rem', borderRadius: '12px', background: n.is_read ? 'transparent' : 'var(--bg-color)',
                borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--primary)',
                cursor: 'pointer', transition: '0.2s'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <strong>{n.actor_name}</strong> {n.type === 'like' && 'liked your post'} {n.type === 'comment' && 'commented on your post'} {n.type === 'follow' && 'started following you'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="sidebar-actions" style={{ marginTop: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!collapsed && (
          <button 
            className="btn hoverable" 
            style={{ width: '100%', background: 'var(--primary)', color: '#111', padding: '0.85rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center' }}
            onClick={() => {
              if (location.pathname !== '/feed') {
                navigate('/feed', { state: { openNewPost: true } });
              } else {
                document.getElementById('global-new-post')?.click();
              }
            }}
          >
            New Post
          </button>
        )}
        <div className="sidebar-item hoverable" onClick={() => { logout(); navigate('/login'); }} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '1rem' }}>
          <span className="sidebar-icon"><LogOut size={20} /></span>
          {!collapsed && <span className="desktop-only">Logout</span>}
        </div>
      </div>
    </aside>
  );
}
